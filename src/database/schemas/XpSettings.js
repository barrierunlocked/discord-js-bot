const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  guild: {
    type: String,
    required: true,
  },
  xproles: {
    type: Map,
    of: { type: String },
  },
});

module.exports = mongoose.model('XpSettings', Schema);