import express from "express";
import { User } from "../lib/jsonDB.js";

const router = express.Router();

// Get all users (for DM list, etc.)
router.get("/", async (req, res) => {
  const users = await User.find({});
  const userList = users.map(user => ({ username: user.username, _id: user.id, id: user.id }));
  res.json(userList);
});

// Get current user profile
router.get("/me", async (req, res) => {
  const user = await User.findById(req.userId, "username _id");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ ...user, _id: user.id });
});

export default router;
