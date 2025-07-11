import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get all users (for DM list, etc.)
router.get("/", async (req, res) => {
  const users = await User.find({}, "username _id");
  res.json(users);
});

// Get current user profile
router.get("/me", async (req, res) => {
  const user = await User.findById(req.userId, "username _id");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

export default router;
