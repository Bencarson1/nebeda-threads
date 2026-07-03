import mongoose from "mongoose";

const reviewImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    rating: { type: Number, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, trim: true, maxlength: 2000 },
    images: { type: [reviewImageSchema], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", required: true },
    reviewToken: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date, required: true },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ reviewToken: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1, submittedAt: -1 });
reviewSchema.index({ status: 1, submittedAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
