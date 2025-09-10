const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Fan nomi (Matematika, Ingliz tili)
    teacher: { type: mongoose.Types.ObjectId, ref: "User", required: true }, // O‘qituvchi
    class: { type: mongoose.Types.ObjectId, ref: "Class", required: true }, // Qaysi sinfga tegishli
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
