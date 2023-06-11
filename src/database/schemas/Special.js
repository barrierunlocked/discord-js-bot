const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  helpStaticMessageId: {
    type: String,
    default: null,
  },
});

const Guild = mongoose.model('Guild', guildSchema);

module.exports = Guild;
