const express = require("express");
const router = express.Router();

const {
  getHistory,
  deleteHistoryItem,
  clearHistory,
} = require("../controllers/historyController");

const { protect } = require("../middleware/authMiddleware");

// Get logged-in user's history
router.get("/", protect, getHistory);

// Delete one history item
router.delete("/:id", protect, deleteHistoryItem);

// Clear all history
router.delete("/", protect, clearHistory);

module.exports = router;