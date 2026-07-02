import mongoose from "mongoose";

import { getStripeClient } from "../config/stripe.js";
import CustomOrder from "../models/CustomOrder.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  customOrderPaidNotificationEmail,
  customOrderPaymentReceivedEmail,
  customOrderPaymentStatusUpdateEmail,
  paidOrderNotificationEmail,
  paymentConfirmationEmail,
  paymentFailedEmail,
} from "../utils/emailTemplates.js";
import { sendEmailSafely } from "../utils/sendEmail.js";
import { ensureCheckoutPrice } from "../utils/productPricing.js";
import { optionMatches } from "../utils/productOptions.js";

const getClientUrl = () => {
  const clientUrl = process.env.CLIENT_URL?.trim().replace(/\/$/, "");
  if (!clientUrl) throw new Error("CLIENT_URL is required for Stripe Checkout redirects.");
  return clientUrl;
};

const getReusableSession = async (stripe, entity) => {
  if (!entity.stripeSessionId) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(entity.stripeSessionId);
    return session.status === "open" && session.url ? session : null;
  } catch (_error) {
    return null;
  }
};

const getOrderCurrency = (order) => {
  const currencies = new Set(order.items.map((item) => (item.currency === "EUR" ? "EUR" : "GBP")));
  if (currencies.size > 1) throw new Error("Mixed-currency orders cannot be paid in one Stripe session.");
  return [...currencies][0] || order.currency || "GBP";
};

const createOrderLineItems = (order, currency) => {
  const lineItems = order.items.map((item) => {
    const unitAmount = Math.round(Number(item.priceAmount ?? item.numericPrice) * 100);
    if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
      throw new Error(`A valid payment price is required for ${item.name}.`);
    }
    const images = typeof item.image === "string" && item.image.startsWith("https://")
      ? [item.image]
      : undefined;
    return {
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name,
          description: [
            item.selectedColour ? `Colour: ${item.selectedColour}` : null,
            item.selectedSize ? `Size: ${item.selectedSize}` : null,
          ].filter(Boolean).join(" | ") || undefined,
          ...(images && { images }),
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });

  const shippingCost = Number(order.shipping?.shippingCost ?? order.totals?.deliveryFee ?? 0);
  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: order.shipping?.shippingMethod || "Shipping",
          description: order.shipping?.estimatedDelivery || undefined,
        },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });
  }
  return lineItems;
};

const parseQuoteAmount = (value) => {
  const amount = Number(String(value || "").replace(/,/g, "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const validateOrderProductsForPayment = async (order) => {
  const products = await Product.find({
    _id: { $in: order.items.map((item) => item.product) },
    isActive: true,
  });
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  if (products.length !== new Set(order.items.map((item) => item.product.toString())).size) {
    throw new Error("One or more products are no longer available. Please contact Nebeda Threads.");
  }

  for (const item of order.items) {
    const product = productsById.get(item.product.toString());
    const pricing = await ensureCheckoutPrice(product);
    if (pricing.isQuoteOnly || !pricing.amount) {
      throw new Error("Product price is not configured. Please contact Nebeda Threads.");
    }
    if (product.trackInventory && product.inventory < item.quantity) {
      throw new Error(`${product.name} is no longer available in the requested quantity.`);
    }
    const variation = product.variations?.find((entry) =>
      entry.isActive !== false &&
      (!entry.size || optionMatches(entry.size, item.selectedSize)) &&
      (!entry.color || optionMatches(entry.color, item.selectedColour))
    );
    if (variation && Number.isFinite(variation.stock) && variation.stock < item.quantity) {
      throw new Error(`The selected ${product.name} variation is out of stock.`);
    }
  }
};

const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!req.user.isEmailVerified) {
    res.status(403);
    throw new Error("Please verify your email before completing payment.");
  }
  const { orderId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("A valid orderId is required.");
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id, isArchived: false });
  if (!order) {
    res.status(404);
    throw new Error("Order not found or does not belong to this account.");
  }
  if (order.paymentStatus === "Paid") {
    res.status(409);
    throw new Error("This order has already been paid.");
  }
  if (order.orderStatus === "Cancelled") {
    res.status(409);
    throw new Error("Cancelled orders cannot be paid.");
  }
  if (!order.items?.length) {
    res.status(400);
    throw new Error("This order does not contain any items.");
  }

  await validateOrderProductsForPayment(order);

  const stripe = getStripeClient();
  const reusableSession = await getReusableSession(stripe, order);
  if (reusableSession) {
    res.json({ success: true, checkoutUrl: reusableSession.url });
    return;
  }

  let currency;
  try {
    currency = getOrderCurrency(order);
  } catch (error) {
    res.status(400);
    throw error;
  }

  const metadata = {
    kind: "order",
    orderId: order._id.toString(),
    userId: req.user._id.toString(),
    customerEmail: order.customer.email,
  };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer.email,
    line_items: createOrderLineItems(order, currency),
    success_url: `${getClientUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getClientUrl()}/payment/cancel?orderId=${order._id}`,
    metadata,
    payment_intent_data: { metadata },
  }, { idempotencyKey: `checkout-${order._id}-${order.updatedAt.getTime()}` });

  if (!session.url) {
    res.status(502);
    throw new Error("Stripe did not return a Checkout URL. Please try again.");
  }

  order.stripeSessionId = session.id;
  order.paymentProvider = "Stripe";
  order.currency = currency;
  await order.save();
  res.json({ success: true, checkoutUrl: session.url });
});

const createCustomOrderCheckoutSession = asyncHandler(async (req, res) => {
  if (!req.user.isEmailVerified) {
    res.status(403);
    throw new Error("Please verify your email before completing payment.");
  }
  const { customOrderId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(customOrderId)) {
    res.status(400);
    throw new Error("A valid customOrderId is required.");
  }

  const customOrder = await CustomOrder.findOne({
    _id: customOrderId,
    user: req.user._id,
    isArchived: false,
  });
  if (!customOrder) {
    res.status(404);
    throw new Error("Custom order not found or does not belong to this account.");
  }
  if (customOrder.paymentStatus === "Paid") {
    res.status(409);
    throw new Error("This custom order has already been paid.");
  }
  if (customOrder.orderStatus === "Cancelled") {
    res.status(409);
    throw new Error("Cancelled custom orders cannot be paid.");
  }
  if (customOrder.orderStatus !== "Awaiting Payment") {
    res.status(400);
    throw new Error("This custom-order quote is not ready for payment.");
  }

  const quoteAmount = parseQuoteAmount(customOrder.estimatedPrice);
  const unitAmount = Math.round(quoteAmount * 100);
  if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
    res.status(400);
    throw new Error("A valid custom-order quote is required before payment.");
  }

  const stripe = getStripeClient();
  const reusableSession = await getReusableSession(stripe, customOrder);
  if (reusableSession) {
    res.json({ success: true, checkoutUrl: reusableSession.url });
    return;
  }

  const metadata = {
    kind: "customOrder",
    customOrderId: customOrder._id.toString(),
    userId: req.user._id.toString(),
    customerEmail: customOrder.email,
  };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customOrder.email,
    line_items: [{
      price_data: {
        currency: "gbp",
        product_data: {
          name: `Custom Order: ${customOrder.outfitType}`,
          description: "Approved Nebeda Threads bespoke quotation",
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }],
    success_url: `${getClientUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=custom-order`,
    cancel_url: `${getClientUrl()}/payment/cancel?customOrderId=${customOrder._id}`,
    metadata,
    payment_intent_data: { metadata },
  }, { idempotencyKey: `custom-checkout-${customOrder._id}-${customOrder.updatedAt.getTime()}` });

  if (!session.url) {
    res.status(502);
    throw new Error("Stripe did not return a Checkout URL. Please try again.");
  }

  customOrder.stripeSessionId = session.id;
  customOrder.paymentProvider = "Stripe";
  await customOrder.save();
  res.json({ success: true, checkoutUrl: session.url });
});

const adjustPaidOrderInventory = async (orderId) => {
  const databaseSession = await mongoose.startSession();
  try {
    await databaseSession.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        inventoryAdjusted: { $ne: true },
      }).session(databaseSession);
      if (!order) return;

      for (const item of order.items) {
        const product = await Product.findById(item.product).session(databaseSession);
        if (!product?.trackInventory) continue;
        product.inventory = Math.max(0, product.inventory - item.quantity);

        const variation = product.variations?.find(
          (entry) =>
            (!entry.size || optionMatches(entry.size, item.selectedSize)) &&
            (!entry.color || optionMatches(entry.color, item.selectedColour)),
        );
        if (variation && Number.isFinite(variation.stock)) {
          variation.stock = Math.max(0, variation.stock - item.quantity);
        }
        await product.save({ session: databaseSession });
      }

      order.inventoryAdjusted = true;
      await order.save({ session: databaseSession });
    });
  } finally {
    await databaseSession.endSession();
  }
};

const handleCompletedOrderCheckout = async (session) => {
  const orderId = session.metadata?.orderId;
  if (!mongoose.Types.ObjectId.isValid(orderId) || session.payment_status !== "paid") return;

  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "Paid" }, isArchived: false },
    {
      $set: {
        paymentStatus: "Paid",
        orderStatus: "Confirmed",
        paymentProvider: "Stripe",
        paidAt: new Date(),
        stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
        paymentFailureReason: "",
      },
      $push: { statusHistory: { status: "Confirmed", changedAt: new Date(), note: "Payment confirmed by Stripe." } },
    },
    { new: true },
  );
  if (!order) {
    const paidOrder = await Order.findOne({ _id: orderId, paymentStatus: "Paid", isArchived: false });
    if (paidOrder && !paidOrder.inventoryAdjusted) await adjustPaidOrderInventory(paidOrder._id);
    return;
  }
  await adjustPaidOrderInventory(order._id);
  await Promise.all([
    sendEmailSafely(paymentConfirmationEmail(order)),
    sendEmailSafely(paidOrderNotificationEmail(order)),
  ]);
};

const handleCompletedCustomOrderCheckout = async (session) => {
  const customOrderId = session.metadata?.customOrderId;
  if (!mongoose.Types.ObjectId.isValid(customOrderId) || session.payment_status !== "paid") return;

  const customOrder = await CustomOrder.findOneAndUpdate(
    { _id: customOrderId, paymentStatus: { $ne: "Paid" }, isArchived: false },
    {
      $set: {
        paymentStatus: "Paid",
        orderStatus: "Paid",
        paymentProvider: "Stripe",
        paidAt: new Date(),
        stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
      },
    },
    { new: true },
  );
  if (!customOrder) return;
  await Promise.all([
    sendEmailSafely(customOrderPaymentReceivedEmail(customOrder)),
    sendEmailSafely(customOrderPaidNotificationEmail(customOrder)),
  ]);
};

const handleExpiredCheckout = async (session) => {
  if (session.metadata?.kind === "customOrder") return;
  const orderId = session.metadata?.orderId;
  if (!mongoose.Types.ObjectId.isValid(orderId)) return;
  await Order.updateOne(
    { _id: orderId, paymentStatus: "Pending" },
    { $set: { paymentFailureReason: "Stripe Checkout expired before payment was completed." } },
  );
};

const handleFailedPayment = async (paymentIntent) => {
  if (paymentIntent.metadata?.kind === "customOrder") {
    const customOrderId = paymentIntent.metadata?.customOrderId;
    if (!mongoose.Types.ObjectId.isValid(customOrderId)) return;
    const customOrder = await CustomOrder.findOneAndUpdate(
      { _id: customOrderId, paymentStatus: { $ne: "Paid" } },
      { $set: { paymentStatus: "Failed", paymentProvider: "Stripe", paymentIntentId: paymentIntent.id } },
      { new: true },
    );
    if (customOrder) await sendEmailSafely(customOrderPaymentStatusUpdateEmail(customOrder));
    return;
  }

  const orderId = paymentIntent.metadata?.orderId;
  if (!mongoose.Types.ObjectId.isValid(orderId)) return;
  const reason = paymentIntent.last_payment_error?.message || "Stripe payment failed.";
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "Paid" } },
    { $set: {
      paymentStatus: "Failed",
      paymentProvider: "Stripe",
      paymentIntentId: paymentIntent.id,
      paymentFailureReason: reason.slice(0, 500),
    } },
    { new: true },
  );
  if (order) await sendEmailSafely(paymentFailedEmail(order));
};

const stripeWebhookHandler = async (req, res, next) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const signature = req.headers["stripe-signature"];
    if (!webhookSecret) {
      res.status(503);
      throw new Error("Stripe webhook is not configured.");
    }
    if (!signature) {
      res.status(400);
      throw new Error("Stripe signature is missing.");
    }

    let event;
    try {
      event = getStripeClient().webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (_error) {
      res.status(400);
      throw new Error("Stripe webhook signature verification failed.");
    }

    if (event.type === "checkout.session.completed") {
      if (event.data.object.metadata?.kind === "customOrder") {
        await handleCompletedCustomOrderCheckout(event.data.object);
      } else {
        await handleCompletedOrderCheckout(event.data.object);
      }
    } else if (event.type === "checkout.session.expired") {
      await handleExpiredCheckout(event.data.object);
    } else if (event.type === "payment_intent.payment_failed") {
      await handleFailedPayment(event.data.object);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

export {
  createCheckoutSession,
  createCustomOrderCheckoutSession,
  stripeWebhookHandler,
};
