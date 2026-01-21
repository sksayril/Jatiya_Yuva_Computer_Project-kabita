const mongoose = require('mongoose');

const masterSettingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Type is required'],
      unique: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const MasterSetting = mongoose.models.MasterSetting || mongoose.model('MasterSetting', masterSettingSchema);

module.exports = MasterSetting;

