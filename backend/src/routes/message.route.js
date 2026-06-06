import express from "express";
import { getAllContacts, getMessagesByUserId, sendMessage, getChatPartners, deleteMessage, togglePinMessage, blockUser, toggleReaction, votePoll } from "../controllers/message.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.

router.use(arcjetProtection, protectedRoute);

router.get("/contacts", getAllContacts);

router.get("/chats", getChatPartners);

router.get("/:id", getMessagesByUserId);

router.delete("/delete/:id", deleteMessage);

router.put("/pin/:id", togglePinMessage);

router.post("/send/:id", sendMessage);

router.post("/block/:id", blockUser);

router.put("/reaction/:id", toggleReaction);

router.post("/vote/:id", votePoll);

export default router;