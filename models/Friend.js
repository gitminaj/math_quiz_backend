const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Friendship", friendshipSchema);
