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
      {
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // teacher
          required: true,
        },
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject", // tanlangan fan
          required: true,
        },
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
