import mongoose from "mongoose";

import AiAssistantEvent from "../models/AiAssistantEvent.js";
import AiAssistantKnowledge from "../models/AiAssistantKnowledge.js";
import asyncHandler from "../utils/asyncHandler.js";

const defaultKnowledge = [
  {
    section: "faqs",
    title: "Frequently Asked Questions",
    content: "Customers can shop ready-to-wear products, request bespoke pieces, track orders from their account, and contact Nebeda Threads on WhatsApp for specialist support.",
  },
  {
    section: "shipping",
    title: "Shipping Policy",
    content: "UK delivery includes Standard and Express options. Europe, USA, and Canada have supported international rates. Nigeria and unsupported countries may require a custom shipping quote before payment.",
  },
  {
    section: "payment",
    title: "Payment Policy",
    content: "Ready-to-wear checkout uses secure Stripe Checkout. Nebeda Threads confirms payment only after Stripe verifies the transaction.",
  },
  {
    section: "returns",
    title: "Returns Guidance",
    content: "Ready-to-wear return eligibility depends on condition and timing. Bespoke, altered, personalised, and made-to-measure pieces may have different rules unless faulty.",
  },
  {
    section: "measurement-guide",
    title: "Measurement Guide",
    content: "Custom order measurements should be taken carefully with a soft tape. Customers can submit the measurements they know and request WhatsApp guidance for anything unclear.",
  },
  {
    section: "business-hours",
    title: "Business Hours",
    content: "Nebeda Threads responds as soon as possible. Customers with urgent fitting, deadline, or order questions should use WhatsApp support.",
  },
  {
    section: "contact",
    title: "Contact Information",
    content: "WhatsApp: +447448668759. Email: support@nebedathreads.co.uk. Instagram: @nebeda_threads_luxury_fashion.",
  },
  {
    section: "delivery-estimates",
    title: "Delivery Estimates",
    content: "UK Standard is usually 2 to 4 working days. UK Express is usually 1 to 2 working days. Europe is usually 5 to 10 working days. USA and Canada are usually 7 to 14 working days.",
  },
];

function sanitizeText(value) {
  return String(value || "")
    .replace(/\S+@\S+\.\S+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[phone]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function sanitizeShort(value, max = 80) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function ensureDefaultKnowledge() {
  const count = await AiAssistantKnowledge.countDocuments();
  if (count > 0) return;
  await AiAssistantKnowledge.insertMany(defaultKnowledge, { ordered: false });
}

function groupByField(field, limit = 8) {
  return AiAssistantEvent.aggregate([
    { $match: { [field]: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, label: "$_id", count: 1 } },
  ]);
}

const getPublicKnowledge = asyncHandler(async (_req, res) => {
  await ensureDefaultKnowledge();
  const knowledge = await AiAssistantKnowledge.find({ isActive: true })
    .select("section title content updatedAt")
    .sort({ section: 1 });

  res.json({ success: true, data: knowledge });
});

const recordAssistantEvent = asyncHandler(async (req, res) => {
  const allowedEvents = new Set([
    "opened",
    "message_sent",
    "suggestion_clicked",
    "product_recommendation",
    "no_answer",
    "whatsapp_escalation",
    "bespoke_started",
    "conversation_completed",
  ]);
  const eventType = sanitizeShort(req.body?.eventType, 60);

  if (!allowedEvents.has(eventType)) {
    res.status(400);
    throw new Error("Assistant event type is invalid.");
  }

  const productId = mongoose.Types.ObjectId.isValid(req.body?.productId)
    ? req.body.productId
    : undefined;

  await AiAssistantEvent.create({
    eventType,
    topic: sanitizeShort(req.body?.topic),
    questionText: sanitizeText(req.body?.questionText),
    productName: sanitizeShort(req.body?.productName, 120),
    productId,
    colour: sanitizeShort(req.body?.colour, 60),
    occasion: sanitizeShort(req.body?.occasion, 80),
    budget: sanitizeShort(req.body?.budget, 80),
    source: sanitizeShort(req.body?.source, 80),
  });

  res.status(201).json({ success: true });
});

const getAdminAssistantAnalytics = asyncHandler(async (_req, res) => {
  const [
    totalEvents,
    opened,
    completedConversations,
    whatsappEscalations,
    bespokeStarted,
    noAnswerCount,
    mostAskedQuestions,
    mostSearchedProducts,
    questionsWithNoAnswer,
    popularColours,
    popularOccasions,
    popularBudgets,
  ] = await Promise.all([
    AiAssistantEvent.countDocuments(),
    AiAssistantEvent.countDocuments({ eventType: "opened" }),
    AiAssistantEvent.countDocuments({ eventType: "conversation_completed" }),
    AiAssistantEvent.countDocuments({ eventType: "whatsapp_escalation" }),
    AiAssistantEvent.countDocuments({ eventType: "bespoke_started" }),
    AiAssistantEvent.countDocuments({ eventType: "no_answer" }),
    groupByField("topic"),
    groupByField("productName"),
    AiAssistantEvent.find({ eventType: "no_answer" })
      .select("questionText createdAt")
      .sort({ createdAt: -1 })
      .limit(10),
    groupByField("colour"),
    groupByField("occasion"),
    groupByField("budget"),
  ]);

  const conversionRate = opened > 0 ? Math.round((completedConversations / opened) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalEvents,
      mostAskedQuestions,
      mostSearchedProducts,
      questionsWithNoAnswer,
      whatsappEscalations,
      bespokeStarted,
      completedConversations,
      conversionRate,
      popularColours,
      popularOccasions,
      popularBudgets,
      noAnswerCount,
    },
  });
});

const getAdminKnowledge = asyncHandler(async (_req, res) => {
  await ensureDefaultKnowledge();
  const knowledge = await AiAssistantKnowledge.find().sort({ section: 1 });
  res.json({ success: true, data: knowledge });
});

const updateKnowledge = asyncHandler(async (req, res) => {
  const { title, content, isActive } = req.body || {};

  if (!title?.trim() || !content?.trim()) {
    res.status(400);
    throw new Error("Knowledge title and content are required.");
  }

  const knowledge = await AiAssistantKnowledge.findById(req.params.id);
  if (!knowledge) {
    res.status(404);
    throw new Error("Knowledge record not found.");
  }

  knowledge.title = title.trim();
  knowledge.content = content.trim();
  knowledge.isActive = Boolean(isActive);
  knowledge.updatedBy = req.admin?._id;
  await knowledge.save();

  res.json({ success: true, data: knowledge });
});

export {
  getAdminAssistantAnalytics,
  getAdminKnowledge,
  getPublicKnowledge,
  recordAssistantEvent,
  updateKnowledge,
};
