import CustomOrder from "../models/CustomOrder.js";
import Enquiry from "../models/Enquiry.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const getDashboardStats = asyncHandler(async (_req, res) => {
  const [
    totalProducts,
    activeProducts,
    inactiveProducts,
    totalUsers,
    activeUsers,
    totalOrders,
    customOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    pendingPayments,
    paidOrders,
    paidCartOrders,
    totalRevenueResult,
    readyToWearProducts,
    bespokeRequests,
    weddingRequests,
    enquiries,
    newEnquiries,
    newsletterSubscribers,
    activeNewsletterSubscribers,
    unsubscribedNewsletterSubscribers,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Order.countDocuments({ isArchived: false }),
    CustomOrder.countDocuments({ isArchived: false }),
    Order.countDocuments({ isArchived: false, orderStatus: "Pending" }),
    Order.countDocuments({ isArchived: false, orderStatus: "Processing" }),
    Order.countDocuments({ isArchived: false, orderStatus: "Shipped" }),
    Order.countDocuments({ isArchived: false, orderStatus: "Delivered" }),
    Order.countDocuments({ isArchived: false, paymentStatus: "Pending" }),
    CustomOrder.countDocuments({ isArchived: false, paymentStatus: "Paid" }),
    Order.countDocuments({ isArchived: false, paymentStatus: "Paid" }),
    Order.aggregate([
      { $match: { isArchived: false, paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totals.total" } } },
    ]),
    Product.countDocuments({ categories: "Ready to Wear" }),
    CustomOrder.countDocuments({ isArchived: false, orderType: "Bespoke" }),
    CustomOrder.countDocuments({ isArchived: false, orderType: "Wedding" }),
    Enquiry.countDocuments({ isArchived: false }),
    Enquiry.countDocuments({ isArchived: false, status: "New" }),
    NewsletterSubscriber.countDocuments(),
    NewsletterSubscriber.countDocuments({ isSubscribed: true }),
    NewsletterSubscriber.countDocuments({ isSubscribed: false }),
  ]);

  const [paidCustomRevenueOrders, pendingCustomPayments] = await Promise.all([
    CustomOrder.find({ isArchived: false, paymentStatus: "Paid" }).select("estimatedPrice").lean(),
    CustomOrder.countDocuments({ isArchived: false, orderStatus: "Awaiting Payment", paymentStatus: { $ne: "Paid" } }),
  ]);
  const customRevenue = paidCustomRevenueOrders.reduce((total, order) => {
    const amount = Number(String(order.estimatedPrice || "").replace(/,/g, "").replace(/[^0-9.]/g, ""));
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const totalRevenue = (totalRevenueResult[0]?.total || 0) + customRevenue;

  res.json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalUsers,
      activeUsers,
      totalOrders,
      customOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      pendingPayments: pendingPayments + pendingCustomPayments,
      readyToWearProducts,
      bespokeRequests,
      weddingRequests,
      enquiries,
      newEnquiries,
      newsletterSubscribers,
      activeNewsletterSubscribers,
      unsubscribedNewsletterSubscribers,
      paidOrders: paidCartOrders,
      paidCustomOrders: paidOrders,
      totalRevenue,
    },
  });
});

const getDashboardActivity = asyncHandler(async (req, res) => {
  const allowedLimits = new Set([5, 10, 25]);
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = allowedLimits.has(requestedLimit) ? requestedLimit : 5;
  const skip = (page - 1) * limit;

  const [result] = await User.aggregate([
    {
      $project: {
        _id: 1,
        type: { $literal: "user" },
        label: { $literal: "Customer" },
        title: "$fullName",
        description: "$email",
        createdAt: 1,
      },
    },
    {
      $unionWith: {
        coll: Order.collection.name,
        pipeline: [
          { $match: { isArchived: false } },
          {
            $project: {
              _id: 1,
              type: { $literal: "order" },
              label: { $literal: "Order" },
              title: { $ifNull: ["$customer.fullName", "Customer order"] },
              description: {
                $concat: [
                  { $ifNull: ["$orderStatus", "Pending"] },
                  " · Payment ",
                  { $ifNull: ["$paymentStatus", "Pending"] },
                ],
              },
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: CustomOrder.collection.name,
        pipeline: [
          { $match: { isArchived: false } },
          {
            $project: {
              _id: 1,
              type: { $literal: "custom-order" },
              label: { $literal: "Custom Order" },
              title: { $ifNull: ["$fullName", "Custom-order customer"] },
              description: {
                $concat: [
                  { $ifNull: ["$outfitType", "Outfit"] },
                  " · ",
                  { $ifNull: ["$orderStatus", "New"] },
                ],
              },
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: Product.collection.name,
        pipeline: [
          {
            $project: {
              _id: 1,
              type: { $literal: "product" },
              label: { $literal: "Product" },
              title: "$name",
              description: { $ifNull: ["$displayCategory", "Nebeda Threads"] },
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: Enquiry.collection.name,
        pipeline: [
          { $match: { isArchived: false } },
          {
            $project: {
              _id: 1,
              type: { $literal: "enquiry" },
              label: { $literal: "Enquiry" },
              title: { $ifNull: ["$fullName", "Customer enquiry"] },
              description: { $ifNull: ["$enquiryType", "General Enquiry"] },
              createdAt: 1,
            },
          },
        ],
      },
    },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        activities: [{ $skip: skip }, { $limit: limit }],
        metadata: [{ $count: "total" }],
      },
    },
  ]);

  const total = result?.metadata?.[0]?.total || 0;
  res.json({
    success: true,
    activities: result?.activities || [],
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
    limit,
  });
});

export { getDashboardActivity, getDashboardStats };
