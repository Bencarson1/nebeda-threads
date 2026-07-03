import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";

import Review from "../models/Review.js";
import asyncHandler from "../utils/asyncHandler.js";
import { hashReviewToken } from "../utils/reviewInvitations.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const getInvitation = (token) => Review.findOne({ reviewToken: hashReviewToken(token) })
  .select("+reviewToken")
  .populate("productId", "name slug mainImage images")
  .populate("orderId", "orderStatus customer createdAt");

const ensureUsableInvitation = (review, res) => {
  if (!review) {
    res.status(404);
    throw new Error("This review invitation is invalid.");
  }
  if (review.submittedAt) {
    res.status(409);
    throw new Error("This review invitation has already been used.");
  }
  if (review.tokenExpiresAt.getTime() <= Date.now()) {
    res.status(410);
    throw new Error("This review invitation has expired.");
  }
  if (review.orderId?.orderStatus !== "Delivered") {
    res.status(403);
    throw new Error("Reviews are available only after delivery.");
  }
};

const getReviewInvitation = asyncHandler(async (req, res) => {
  const review = await getInvitation(req.params.token);
  ensureUsableInvitation(review, res);
  res.json({
    success: true,
    invitation: {
      product: review.productId,
      orderReference: review.orderId._id,
      orderDate: review.orderId.createdAt,
      customerFirstName: review.customerName.trim().split(/\s+/)[0],
      expiresAt: review.tokenExpiresAt,
    },
  });
});

const submitReview = asyncHandler(async (req, res) => {
  const review = await getInvitation(req.params.token);
  ensureUsableInvitation(review, res);

  const rating = Number(req.body.rating);
  const title = String(req.body.title || "").trim();
  const comment = String(req.body.comment || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Please choose a rating from 1 to 5 stars.");
  }
  if (!title || title.length > 100) {
    res.status(400);
    throw new Error("Review title is required and must be 100 characters or fewer.");
  }
  if (!comment || comment.length > 2000) {
    res.status(400);
    throw new Error("Review comment is required and must be 2000 characters or fewer.");
  }

  const images = await Promise.all((req.files || []).map((file) => uploadToCloudinary({
    buffer: file.buffer,
    folder: "nebeda/reviews",
    alt: review.productId.name + " customer review",
  })));

  const submittedReview = await Review.findOneAndUpdate(
    {
      _id: review._id,
      submittedAt: { $exists: false },
      tokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        rating,
        title,
        comment,
        images,
        status: "pending",
        submittedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!submittedReview) {
    res.status(409);
    throw new Error("This review invitation has already been used or has expired.");
  }

  res.status(201).json({
    success: true,
    message: "Thank you. Your verified review has been submitted for approval.",
  });
});

const getProductReviews = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
    res.status(400);
    throw new Error("Invalid product id.");
  }
  const reviews = await Review.find({
    productId: req.params.productId,
    status: "approved",
    submittedAt: { $exists: true },
  }).select("customerName rating title comment images submittedAt approvedAt").sort("-submittedAt").lean();

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const publicReviews = reviews.map((review) => ({
    ...review,
    customerName: review.customerName.trim().split(/\s+/)[0],
  }));
  res.json({ success: true, count: reviews.length, averageRating, reviews: publicReviews });
});

const getAdminReviews = asyncHandler(async (req, res) => {
  const { status = "all", search = "", page = 1, limit = 20 } = req.query;
  const query = { submittedAt: { $exists: true } };
  if (["pending", "approved", "rejected"].includes(status)) query.status = status;
  if (search.trim()) {
    const safeSearch = new RegExp(search.replace(/[.*+?^$()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ customerName: safeSearch }, { title: safeSearch }, { comment: safeSearch }];
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate("productId", "name slug mainImage")
      .populate("orderId", "createdAt")
      .sort("-submittedAt")
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Review.countDocuments(query),
  ]);

  res.json({
    success: true,
    reviews,
    total,
    page: safePage,
    pages: Math.max(Math.ceil(total / safeLimit), 1),
  });
});

const updateReviewStatus = (status) => asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, submittedAt: { $exists: true } });
  if (!review) {
    res.status(404);
    throw new Error("Review not found.");
  }
  review.status = status;
  review.approvedAt = status === "approved" ? new Date() : undefined;
  await review.save();
  res.json({
    success: true,
    message: status === "approved" ? "Review approved successfully." : "Review rejected successfully.",
    review,
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found.");
  }
  await review.deleteOne();
  res.json({ success: true, message: "Review deleted successfully." });
});

const approveReview = updateReviewStatus("approved");
const rejectReview = updateReviewStatus("rejected");

export {
  approveReview,
  deleteReview,
  getAdminReviews,
  getProductReviews,
  getReviewInvitation,
  rejectReview,
  submitReview,
};
