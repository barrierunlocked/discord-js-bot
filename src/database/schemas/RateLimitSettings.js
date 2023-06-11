const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guildID: String,
  type: String,
  timelimit: Number,
  permstoremove: [String],
  whitelist: [String],
  rolestoadd: [String],
});

module.exports = mongoose.model('RateLimitSettings', Schema);
