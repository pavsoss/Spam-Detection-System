const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    query: {
      type: String,
      required: true,
      trim: true,
    },

    prediction: {
      type: String,
      required: true,
      enum: ["ham", "spam", "smishing"],
    },

    type: {
      type: String,
      required: true,
      enum: ["message", "email"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);