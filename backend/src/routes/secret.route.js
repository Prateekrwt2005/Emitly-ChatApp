import express from "express";
import { initiateSecretChat, acceptSecretChat, closeSecretChat } from "../controllers/secret.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectedRoute);

router.post("/initiate", initiateSecretChat);
router.post("/accept", acceptSecretChat);
router.post("/close/:id", closeSecretChat);

export default router;
