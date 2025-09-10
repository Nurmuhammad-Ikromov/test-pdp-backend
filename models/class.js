const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    exams: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Exam",
      },
    ],
    students: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    teachers: [
      // 🔥 yangi qo‘shildi
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Class = mongoose.model("Class", classSchema);
module.exports = Class;
