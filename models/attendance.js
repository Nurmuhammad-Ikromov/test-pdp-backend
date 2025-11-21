const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // ISO DATE format
    date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["present", "late", "absent"],
      default: "absent",
    },
    auto_marked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { student: 1, class: 1, subject: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
