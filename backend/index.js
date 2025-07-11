import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import dmRoutes from "./routes/dms.js";
import { verifyJWT } from "./middleware/auth.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", verifyJWT, userRoutes);
app.use("/api/dms", verifyJWT, dmRoutes);

// Socket.IO for DMs
io.use(async (socket, next) => {
  // JWT authentication for sockets (optionally implement)
  next();
});

io.on("connection", (socket) => {
  // Listen for join, message, etc.
  socket.on("join", (userId) => {
    socket.join(userId);
  });
  socket.on("dm", ({ to, from, content }) => {
    io.to(to).emit("dm", { from, content });
  });
});

// Start server
server.listen(process.env.PORT || 5000, () =>
  console.log("Backend running on port", process.env.PORT || 5000)
);
