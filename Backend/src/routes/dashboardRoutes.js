import express from "express";

import { getDashboardActivity, getDashboardStats } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/activity", protect, getDashboardActivity);

export default router;
