require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, message: "TaskFlow API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Serve the frontend from this same Render web service.
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ message: "API route not found" });
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 5000;
async function start() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Add it in your environment variables.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`TaskFlow running on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}
start();
