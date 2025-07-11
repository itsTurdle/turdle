import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: "Missing fields" });
  const exists = await User.findOne({ username });
  if(exists) return res.status(400).json({ error: "Username taken" });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user._id, username: user.username } });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if(!user) return res.status(400).json({ error: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user._id, username: user.username } });
});

export default router;
