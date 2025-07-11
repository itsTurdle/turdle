import express from "express";
import { DM, User, readDB, writeDB } from "../lib/jsonDB.js";

const router = express.Router();

// Get DMs for the user
router.get("/", async (req, res) => {
  const dms = await DM.find({ users: req.userId });
  const users = await User.find({});
  
  // Populate user data manually
  const populatedDMs = await DM.populate(dms, users);
  res.json(populatedDMs);
});

// Send a message (create DM if it doesn't exist)
router.post("/", async (req, res) => {
  const { to, content } = req.body;
  let dm = await DM.findOne({ users: { $all: [req.userId, to] } });
  if (!dm) {
    dm = await DM.create({
      users: [req.userId, to],
      messages: []
    });
  }
  const msg = { sender: req.userId, content, timestamp: new Date().toISOString() };
  dm.messages.push(msg);
  await DM.save(dm);
  res.json(msg);
});

export default router;
