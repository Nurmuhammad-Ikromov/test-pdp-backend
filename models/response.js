const mongoose = require('mongoose')
const { calculatePercentage } = require('../utils/word')

const ResponseSchema = new mongoose.Schema(
  {
    exam_response: {
      type: String,
      required: true
    },
    exam: {
      type: mongoose.Types.ObjectId,
      ref: 'Exam'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'graded', 'rejected', 'reset']
    },
    who: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    class: {
      type: mongoose.Types.ObjectId,
      ref: 'Class'
    },
    type: {
      type: String,
      enum: ['test', 'practise', 'writing']
    },

    grade: {
      type: {
        grade: Number,
        total: Number
      }
    }
  },

  {
    timestamps: true,
    timeseries: true
  }
)

module.exports = mongoose.model('Response', ResponseSchema)
