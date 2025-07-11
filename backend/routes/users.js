import express from "express";
import { UserDB } from "../db/database.js";

const router = express.Router();

// Get all users (for DM list, etc.)
router.get("/", async (req, res) => {
  const users = await UserDB.find({}, "username _id");
  res.json(users);
});

// Get current user profile
router.get("/me", async (req, res) => {
  const user = await UserDB.findById(req.userId, "username _id");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

export default router;
