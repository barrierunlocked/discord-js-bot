const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  userID: String,
  guildID: String,
  type: String,
  timestamp: Number,
  timelimit: Number,
  permstoremove: [String],
  whitelist: [String],
});

module.exports = mongoose.model('RateLimit', rateLimitSchema);
