import express from "express";
import DM from "../models/DM.js";

const router = express.Router();

// Get DMs for the user
router.get("/", async (req, res) => {
  const dms = await DM.find({ users: req.userId })
    .populate("users", "username _id")
    .populate("messages.sender", "username _id")
    .exec();
  res.json(dms);
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
  const msg = { sender: req.userId, content };
  dm.messages.push(msg);
  await dm.save();
  res.json(msg);
});

export default router;
