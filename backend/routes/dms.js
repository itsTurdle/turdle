import express from "express";
import { DMDB } from "../db/database.js";

const router = express.Router();

// Get DMs for the user
router.get("/", async (req, res) => {
  const dms = await DMDB.find({ users: req.userId });
  const populatedDMs = await DMDB.populate(dms, ["users", "messages.sender"]);
  res.json(populatedDMs);
});

// Send a message (create DM if it doesn't exist)
router.post("/", async (req, res) => {
  const { to, content } = req.body;
  let dm = await DMDB.findOne({ users: { $all: [req.userId, to] } });
  if (!dm) {
    dm = await DMDB.create({
      users: [req.userId, to],
      messages: []
    });
  }
  const msg = { sender: req.userId, content, timestamp: new Date().toISOString() };
  dm.messages.push(msg);
  await DMDB.save(dm);
  res.json(msg);
});

export default router;
