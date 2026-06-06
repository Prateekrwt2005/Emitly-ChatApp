import express from "express";
import { createGroup, getGroups, getGroupMessages, sendGroupMessage } from "../controllers/group.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectedRoute);

router.post("/create", createGroup);
router.get("/", getGroups);
router.get("/:id", getGroupMessages);
router.post("/send/:id", sendGroupMessage);

export default router;
