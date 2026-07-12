import express from "express";

import {
  getAdminAssistantAnalytics,
  getAdminKnowledge,
  getPublicKnowledge,
  recordAssistantEvent,
  updateKnowledge,
} from "../controllers/aiAssistantController.js";
import { protect } from "../middleware/authMiddleware.js";
import { publicWriteLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.get("/knowledge", getPublicKnowledge);
router.post("/events", publicWriteLimiter, recordAssistantEvent);

router.get("/admin/analytics", protect, getAdminAssistantAnalytics);
router.get("/admin/knowledge", protect, getAdminKnowledge);
router.put("/admin/knowledge/:id", protect, updateKnowledge);

export default router;
