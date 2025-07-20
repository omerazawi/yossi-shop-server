const mongoose = require("mongoose");

const StatsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

module.exports = mongoose.model("Stats", StatsSchema);