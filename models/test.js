const mongoose = require('mongoose')

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    encodedData: { type: String, required: true },
    status: {
      type: Boolean,
      default: true
    },
    who: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['test', 'practise', 'writing']
    }
  },
  {
    timestamps: true,
    timeseries: true
  }
)

module.exports = mongoose.model('Test', testSchema)
