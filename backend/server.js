require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // ensure SRV records resolve on all networks
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const History = require("./models/History");

const app = express();

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(express.json());

// Auth routes , History routes
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/historyRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

const { protect } = require("./middleware/authMiddleware");

app.get("/", (req, res) => {
  res.send("Node backend running ");
});

// Protected: only authenticated users can predict
app.post("/predict", protect, async (req, res) => {
  try {
    console.log("Reached /predict");
    const { text, type } = req.body;
    console.log("Received:", text, type);

    if (!text || !type) {
      return res.status(400).json({ error: "Text and type are required" });
    }

    if (text.length > 5000) {
      return res.status(413).json({
        error: "Text payload exceeds maximum allowed length of 5000 characters",
      });
    }

    console.log("Calling Flask...");

    const response = await axios.post(process.env.API, {
      text: text,
      type: type,
    });
    console.log("Flask responded:", response.data);

    // Save history automatically

    console.log("Saving history...");
    await History.create({
      user: req.user.id,
      query: text,
      prediction: response.data.prediction,
      type: type,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

console.log("History saved");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
