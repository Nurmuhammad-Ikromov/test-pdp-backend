const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Fan nomi
    teacher: { type: mongoose.Types.ObjectId, ref: "User", required: true }, // Teacher
    class: { type: mongoose.Types.ObjectId, ref: "Class", required: true }, // Qaysi sinfga tegishli
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
