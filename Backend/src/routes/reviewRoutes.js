import express from "express";

import {
  approveReview,
  deleteReview,
  getAdminReviews,
  getProductReviews,
  getReviewInvitation,
  rejectReview,
  submitReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { handleUploadErrors, uploadReviewImages } from "../middleware/uploadMiddleware.js";
import { reviewSubmissionLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.get("/invitation/:token", reviewSubmissionLimiter, getReviewInvitation);
router.post("/invitation/:token", reviewSubmissionLimiter, uploadReviewImages, handleUploadErrors, submitReview);
router.get("/admin", protect, getAdminReviews);
router.patch("/admin/:id/approve", protect, approveReview);
router.patch("/admin/:id/reject", protect, rejectReview);
router.delete("/admin/:id", protect, deleteReview);

export default router;
