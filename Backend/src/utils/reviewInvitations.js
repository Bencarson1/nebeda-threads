import crypto from "crypto";
import Review from "../models/Review.js";

const REVIEW_TOKEN_DAYS = 30;
const hashReviewToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

const createReviewInvitations = async (order) => {
  if (!order?.user || order.orderStatus !== "Delivered") return [];

  const uniqueItems = [...new Map(
    order.items.filter((item) => item.product).map((item) => [item.product.toString(), item]),
  ).values()];
  const invitations = [];

  for (const item of uniqueItems) {
    const existing = await Review.findOne({ productId: item.product, orderId: order._id });
    if (existing) continue;

    const token = crypto.randomBytes(32).toString("hex");
    await Review.create({
      productId: item.product,
      orderId: order._id,
      userId: order.user,
      customerName: order.customer.fullName,
      reviewToken: hashReviewToken(token),
      tokenExpiresAt: new Date(Date.now() + REVIEW_TOKEN_DAYS * 24 * 60 * 60 * 1000),
    });
    invitations.push({ productName: item.name, token });
  }

  return invitations;
};

export { createReviewInvitations, hashReviewToken, REVIEW_TOKEN_DAYS };
