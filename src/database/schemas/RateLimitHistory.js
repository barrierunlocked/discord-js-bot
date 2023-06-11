const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  userID: String,
  guildID: String,
  type: String,
  timestamp: Number,
});

module.exports = mongoose.model('RateLimitHistory', rateLimitSchema);
