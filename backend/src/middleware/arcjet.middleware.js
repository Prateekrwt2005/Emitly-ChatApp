import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
    // Temporarily bypassing Arcjet to check for hangs in development
    return next();
}
