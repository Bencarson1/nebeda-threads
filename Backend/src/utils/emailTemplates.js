const brandEmail = () => process.env.BRAND_NOTIFICATION_EMAIL;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatCurrency = (value = 0, currency = "GBP") => new Intl.NumberFormat(currency === "EUR" ? "en-IE" : "en-GB", { style: "currency", currency }).format(Number(value || 0));
const formatOrderCurrency = (order) =>
  new Intl.NumberFormat(order.currency === "EUR" ? "en-IE" : "en-GB", {
    style: "currency",
    currency: order.currency === "EUR" ? "EUR" : "GBP",
  }).format(Number(order.totals?.total || 0));

const getFirstName = (fullName = "there") => fullName.trim().split(/\s+/)[0] || "there";

const wrapEmail = (title, body) => ({
  text: body.replace(/<[^>]*>/g, "").replace(/\n{3,}/g, "\n\n").trim(),
  html: `
    <div style="font-family: Georgia, 'Times New Roman', serif; background:#050505; color:#f8f3ea; padding:32px;">
      <div style="max-width:640px; margin:auto; border:1px solid rgba(190,151,83,.45); border-radius:18px; padding:28px;">
        <p style="letter-spacing:.28em; color:#be9753; text-transform:uppercase; font-size:12px;">Nebeda Threads</p>
        <h1 style="font-size:28px; line-height:1.2; margin:12px 0 20px;">${escapeHtml(title)}</h1>
        <div style="font-family: Arial, sans-serif; color:#dfd7ca; line-height:1.7; font-size:15px;">${body}</div>
        <div style="font-family: Arial, sans-serif; border-top:1px solid rgba(190,151,83,.25); margin-top:28px; padding-top:20px; color:#aaa197; line-height:1.7; font-size:13px;">
          <p style="margin:0; color:#f8f3ea;"><strong>Nebeda Threads</strong> &middot; Elevate Your Essence</p>
          <p style="margin:6px 0 0;">Email: support@nebedathreads.co.uk &middot; WhatsApp: +44 7448 668759<br><a href="https://nebedathreads.co.uk" style="color:#be9753;">nebedathreads.co.uk</a></p>
        </div>
      </div>
    </div>
  `,
});

const actionButton = (label, url) =>
  `<p style="margin:26px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#be9753;color:#050505;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:8px;">${escapeHtml(label)}</a></p>`;

const emailVerificationEmail = (user, verificationUrl) => ({
  to: user.email,
  relatedUser: user._id,
  subject: "Verify Your Nebeda Threads Email",
  template: "email-verification",
  ...wrapEmail(
    "Verify Your Email",
    `<p>Hello ${escapeHtml(getFirstName(user.fullName))},</p>
     <p>Confirm your email address to securely complete payments and track your Nebeda Threads orders.</p>
     ${actionButton("Verify Email", verificationUrl)}
     <p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`
  ),
});

const passwordResetEmail = (user, resetUrl) => ({
  to: user.email,
  relatedUser: user._id,
  subject: "Reset Your Nebeda Threads Password",
  template: "password-reset",
  ...wrapEmail(
    "Reset Your Password",
    `<p>Hello ${escapeHtml(getFirstName(user.fullName))},</p>
     <p>We received a request to reset your Nebeda Threads password.</p>
     ${actionButton("Reset Password", resetUrl)}
     <p>This secure link expires in one hour. If you did not request it, no action is needed.</p>`
  ),
});
const welcomeEmail = (user) => ({
  template: "welcome",
  to: user.email,
  relatedUser: user._id,
  subject: "Welcome to Nebeda Threads",
  ...wrapEmail(
    "Welcome to Nebeda Threads",
    `<p>Thank you ${escapeHtml(getFirstName(user.fullName))} for joining Nebeda Threads.</p>
     <p>You can shop luxury African fashion, save your cart, submit custom order requests, and receive updates about your Nebeda pieces.</p>`
  ),
});

const newSignupNotificationEmail = (user) => ({
  template: "new-signup-notification",
  to: brandEmail(),
  relatedUser: user._id,
  subject: "New Nebeda Threads Customer Signup",
  ...wrapEmail(
    "New Nebeda Threads Customer Signup",
    `<p><strong>Full name:</strong> ${escapeHtml(user.fullName)}</p>
     <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
     <p><strong>WhatsApp:</strong> ${escapeHtml(user.whatsappNumber || "Not provided")}</p>
     <p><strong>Signup date:</strong> ${new Date().toLocaleString("en-GB")}</p>`
  ),
});

const customOrderConfirmationEmail = (order) => ({
  template: "custom-order-received",
  to: order.email,
  relatedCustomOrder: order._id,
  subject: "Custom Order Request Received",
  ...wrapEmail(
    "Custom Order Request Received",
    `<p>Thank you ${escapeHtml(getFirstName(order.fullName))}. Nebeda Threads has received your custom order request.</p>
     <p>We will review your design, measurements, fabric preferences, and contact you to confirm next steps.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>`
  ),
});

const customOrderNotificationEmail = (order) => ({
  template: "custom-order-notification",
  to: brandEmail(),
  relatedCustomOrder: order._id,
  subject: "New Nebeda Threads Custom Order",
  ...wrapEmail(
    "New Custom Order Request",
    `<p><strong>Customer:</strong> ${escapeHtml(order.fullName)}</p>
     <p><strong>Email:</strong> ${escapeHtml(order.email)}</p>
     <p><strong>WhatsApp:</strong> ${escapeHtml(order.whatsappNumber)}</p>
     <p><strong>Outfit:</strong> ${escapeHtml(order.outfitType)} / ${escapeHtml(order.orderType)}</p>
     <p><strong>Shipping:</strong> ${escapeHtml(order.shipping?.shippingCountry || "Not set")}</p>`
  ),
});

const enquiryConfirmationEmail = (enquiry) => ({
  template: "enquiry-confirmation",
  to: enquiry.email,
  subject: "Your Nebeda Threads Enquiry Has Been Received",
  ...wrapEmail(
    "Enquiry Received",
    `<p>Thank you ${escapeHtml(getFirstName(enquiry.fullName))}. Your enquiry has been received.</p>
     <p>Nebeda Threads will contact you soon.</p>`
  ),
});

const enquiryNotificationEmail = (enquiry) => ({
  template: "enquiry-notification",
  to: brandEmail(),
  subject: "New Nebeda Threads Enquiry",
  ...wrapEmail(
    "New Customer Enquiry",
    `<p><strong>Customer:</strong> ${escapeHtml(enquiry.fullName)}</p>
     <p><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p>
     <p><strong>WhatsApp:</strong> ${escapeHtml(enquiry.whatsappNumber || "Not provided")}</p>
     <p><strong>Type:</strong> ${escapeHtml(enquiry.enquiryType)}</p>
     <p><strong>Message:</strong> ${escapeHtml(enquiry.message)}</p>`
  ),
});

const orderReceivedEmail = (order) => ({
  template: "order-placed",
  to: order.customer.email,
  relatedOrder: order._id,
  subject: "Nebeda Threads Order Received",
  ...wrapEmail(
    "Order Received",
    `<p>Thank you ${escapeHtml(getFirstName(order.customer.fullName))}. Your Nebeda Threads order has been received.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
     <p><strong>Total:</strong> ${formatOrderCurrency(order)}</p>
     <p>Continue to secure Stripe Checkout to complete payment. Your order will be confirmed after payment succeeds.</p>`
  ),
});

const orderNotificationEmail = (order) => ({
  template: "new-order-notification",
  to: brandEmail(),
  relatedOrder: order._id,
  subject: "New Nebeda Threads Cart Order",
  ...wrapEmail(
    "New Cart Order",
    `<p><strong>Customer:</strong> ${escapeHtml(order.customer.fullName)}</p>
     <p><strong>Email:</strong> ${escapeHtml(order.customer.email)}</p>
     <p><strong>Items:</strong> ${order.items.length}</p>
     <p><strong>Total:</strong> ${formatOrderCurrency(order)}</p>
     <p><strong>Status:</strong> ${escapeHtml(order.orderStatus)} / ${escapeHtml(order.paymentStatus)}</p>`
  ),
});

const paymentConfirmationEmail = (order) => ({
  template: "payment-received",
  to: order.customer.email,
  relatedOrder: order._id,
  subject: "Nebeda Threads Payment Confirmation",
  ...wrapEmail(
    "Payment Confirmed",
    `<p>Thank you ${escapeHtml(getFirstName(order.customer.fullName))}. Your payment has been confirmed securely.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
     <p><strong>Amount paid:</strong> ${escapeHtml(formatOrderCurrency(order))}</p>
     <p>Your order is now confirmed and Nebeda Threads will keep you updated as it progresses.</p>`,
  ),
});

const paymentFailedEmail = (order) => ({
  to: order.customer.email,
  relatedOrder: order._id,
  subject: "Nebeda Threads Payment Could Not Be Completed",
  template: "payment-failed",
  ...wrapEmail(
    "Payment Could Not Be Completed",
    `<p>Hello ${escapeHtml(getFirstName(order.customer.fullName))},</p>
     <p>Your order remains safely pending, but the latest payment attempt was not completed.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
     ${actionButton("Complete Payment", "https://nebedathreads.co.uk/account/orders/" + order._id)}
     <p>No successful payment has been recorded for this attempt.</p>`
  ),
});
const paidOrderNotificationEmail = (order) => ({
  template: "paid-order-notification",
  to: brandEmail(),
  relatedOrder: order._id,
  subject: "Paid Nebeda Threads Order",
  ...wrapEmail(
    "Order Payment Received",
    `<p><strong>Customer:</strong> ${escapeHtml(order.customer.fullName)}</p>
     <p><strong>Email:</strong> ${escapeHtml(order.customer.email)}</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
     <p><strong>Amount paid:</strong> ${escapeHtml(formatOrderCurrency(order))}</p>
     <p><strong>Stripe session:</strong> ${escapeHtml(order.stripeSessionId || "Not set")}</p>`,
  ),
});

const orderStatusEmailSubjects = {
  Processing: "Your Nebeda Threads Order Is Being Prepared",
  Shipped: "Your Nebeda Threads Order Has Been Shipped",
  Delivered: "Your Nebeda Threads Order Has Been Delivered",
  Cancelled: "Your Nebeda Threads Order Has Been Cancelled",
};

const orderStatusUpdateEmail = (order) => {
  const shipping = order.shipping || {};
  const trackingDetails = [
    shipping.trackingCarrier
      ? `<p><strong>Tracking carrier:</strong> ${escapeHtml(shipping.trackingCarrier)}</p>`
      : "",
    shipping.trackingNumber
      ? `<p><strong>Tracking number:</strong> ${escapeHtml(shipping.trackingNumber)}</p>`
      : "",
    shipping.trackingUrl
      ? `<p><a href="${escapeHtml(shipping.trackingUrl)}" style="color:#be9753;">Track your delivery</a></p>`
      : "",
  ].join("");

  return {
    to: order.customer.email,
    relatedOrder: order._id,
    subject: orderStatusEmailSubjects[order.orderStatus] || "Nebeda Threads Order Status Update",
    ...wrapEmail(
      orderStatusEmailSubjects[order.orderStatus] || "Order Status Update",
      `<p>Hello ${escapeHtml(getFirstName(order.customer.fullName))},</p>
       <p>Your Nebeda Threads order is now <strong>${escapeHtml(order.orderStatus)}</strong>.</p>
       <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
       ${trackingDetails}`,
    ),
  };
};
const orderPaymentStatusUpdateEmail = (order) => ({
  template: "payment-status-update",
  to: order.customer.email,
  relatedOrder: order._id,
  subject: "Nebeda Threads Payment Status Update",
  ...wrapEmail(
    "Payment Status Update",
    `<p>Your payment status is now <strong>${escapeHtml(order.paymentStatus)}</strong>.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>`
  ),
});

const customOrderQuoteReadyEmail = (order) => ({
  to: order.email,
  relatedCustomOrder: order._id,
  subject: "Your Nebeda Threads Custom Order Quote Is Ready",
  template: "custom-order-quote-ready",
  ...wrapEmail(
    "Your Custom Order Quote Is Ready",
    `<p>Hello ${escapeHtml(getFirstName(order.fullName))},</p>
     <p>Your bespoke request has been reviewed and a quote is ready.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
     <p><strong>Estimated price:</strong> ${formatCurrency(order.estimatedPrice)}</p>
     ${actionButton("View Custom Order", "https://nebedathreads.co.uk/account/custom-orders/" + order._id)}
     <p>We will confirm the final design, delivery, and payment details with you before production.</p>`
  ),
});
const customOrderPaymentReceivedEmail = (order) => ({
  to: order.email,
  relatedCustomOrder: order._id,
  subject: "Nebeda Threads Custom Order Payment Received",
  template: "custom-order-payment-received",
  ...wrapEmail(
    "Custom Order Payment Received",
    `<p>Hello ${escapeHtml(getFirstName(order.fullName))},</p>
     <p>Your payment has been received and your bespoke order can now move into production.</p>
     <p><strong>Reference:</strong> ${escapeHtml(order._id)}</p>
     <p><strong>Amount paid:</strong> ${formatCurrency(order.estimatedPrice)}</p>
     ${actionButton("View Custom Order", "https://nebedathreads.co.uk/account/custom-orders/" + order._id)}`
  ),
});

const customOrderPaidNotificationEmail = (order) => ({
  to: brandEmail(),
  relatedCustomOrder: order._id,
  subject: "Paid Nebeda Threads Custom Order",
  template: "custom-order-paid-notification",
  ...wrapEmail(
    "Custom Order Payment Received",
    `<p><strong>Customer:</strong> ${escapeHtml(order.fullName)}</p>
     <p><strong>Reference:</strong> ${escapeHtml(order._id)}</p>
     <p><strong>Amount:</strong> ${formatCurrency(order.estimatedPrice)}</p>`
  ),
});
const customOrderStatusUpdateEmail = (order) => ({
  template: "custom-order-status",
  to: order.email,
  relatedCustomOrder: order._id,
  subject: "Nebeda Threads Custom Order Update",
  ...wrapEmail(
    "Custom Order Update",
    `<p>Your custom order status is now <strong>${escapeHtml(order.orderStatus)}</strong>.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
     ${order.adminNotes ? `<p><strong>Notes:</strong> ${escapeHtml(order.adminNotes)}</p>` : ""}`
  ),
});

const customOrderPaymentStatusUpdateEmail = (order) => ({
  template: "custom-order-payment-status",
  to: order.email,
  relatedCustomOrder: order._id,
  subject: "Nebeda Threads Custom Order Payment Update",
  ...wrapEmail(
    "Custom Order Payment Update",
    `<p>Your custom order payment status is now <strong>${escapeHtml(order.paymentStatus)}</strong>.</p>
     <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>`
  ),
});

const newsletterWelcomeEmail = (subscriber) => ({
  template: "newsletter-welcome",
  to: subscriber.email,
  subject: "Welcome to Nebeda Threads Updates",
  ...wrapEmail(
    "Welcome to Nebeda Threads Updates",
    `<p>Thank you ${escapeHtml(getFirstName(subscriber.fullName || "there"))} for joining Nebeda Threads updates.</p>
     <p>You will receive new collection alerts, bespoke style inspiration, and exclusive Nebeda Threads offers.</p>`
  ),
});

const newsletterNotificationEmail = (subscriber) => ({
  template: "newsletter-notification",
  to: brandEmail(),
  subject: "New Newsletter Subscriber",
  ...wrapEmail(
    "New Newsletter Subscriber",
    `<p><strong>Email:</strong> ${escapeHtml(subscriber.email)}</p>
     <p><strong>Name:</strong> ${escapeHtml(subscriber.fullName || "Not provided")}</p>
     <p><strong>Source:</strong> ${escapeHtml(subscriber.source || "Not provided")}</p>
     <p><strong>Date:</strong> ${new Date().toLocaleString("en-GB")}</p>`
  ),
});

const reviewRequestEmail = (order, invitations) => {
  const clientUrl = process.env.CLIENT_URL?.trim().replace(/\/$/, "") || "https://nebedathreads.co.uk";
  const links = invitations.map((invitation) =>
    `<div style="margin:18px 0;padding:16px;border:1px solid rgba(190,151,83,.25);border-radius:10px;">
      <p style="margin:0 0 10px;"><strong>${escapeHtml(invitation.productName)}</strong></p>
      ${actionButton("Review This Piece", clientUrl + "/review/" + encodeURIComponent(invitation.token))}
    </div>`,
  ).join("");

  return {
    template: "review-request",
    to: order.customer.email,
    relatedOrder: order._id,
    subject: "How was your Nebeda Threads order?",
    ...wrapEmail(
      "Share Your Experience",
      `<p>Hello ${escapeHtml(getFirstName(order.customer.fullName))},</p>
       <p>Your order has been delivered. We would love to hear how your Nebeda Threads pieces felt and looked.</p>
       <p><strong>Order reference:</strong> ${escapeHtml(order._id)}</p>
       ${links}
       <p>Each secure review link expires after 30 days and can be used once.</p>`,
    ),
  };
};
// Abandoned cart email automation will be added later with scheduled jobs.
// Newsletter broadcast emails will be added later using admin campaign tools.

export {
  customOrderConfirmationEmail,
  emailVerificationEmail,
  customOrderNotificationEmail,
  customOrderPaidNotificationEmail,
  customOrderPaymentReceivedEmail,
  customOrderPaymentStatusUpdateEmail,
  customOrderQuoteReadyEmail,
  customOrderStatusUpdateEmail,
  enquiryConfirmationEmail,
  enquiryNotificationEmail,
  newSignupNotificationEmail,
  newsletterNotificationEmail,
  newsletterWelcomeEmail,
  orderNotificationEmail,
  orderPaymentStatusUpdateEmail,
  orderReceivedEmail,
  orderStatusUpdateEmail,
  paidOrderNotificationEmail,
  passwordResetEmail,
  paymentConfirmationEmail,
  paymentFailedEmail,
  reviewRequestEmail,
  welcomeEmail,
};
