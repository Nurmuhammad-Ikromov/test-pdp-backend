const express = require("express");
const router = express.Router();

const Class = require("../models/class");
const Attendance = require("../models/attendance");
const Grade = require("../models/grade");
const Subject = require("../models/subject");

// ========================================
// Sana → faqat ISO DATE formatiga normalize
// ========================================
function normalizeDay(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Kun boshidan → ertasi kuni boshigacha
function makeRange(dateStr) {
  const start = normalizeDay(dateStr); // UTC midnight
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// ========================================
// GET /director/class/:classId/daily?date=YYYY-MM-DD
// ========================================
router.get("/class/:classId/daily", async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ message: "date is required" });

    const { start, end } = makeRange(date);

    // 1) Class + students
    const cls = await Class.findById(classId)
      .populate("students", "first_name last_name")
      .lean();

    if (!cls) return res.status(404).json({ message: "Class not found" });

    // 2) Subjects + teachers
    const subjects = await Subject.find({ class: classId })
      .populate("teacher", "first_name last_name")
      .lean();

    // ============================================
    // 3) ISO Date format bo‘yicha grades
    // ============================================
    const rawGrades = await Grade.find({
      class: classId,
      date: { $gte: start, $lt: end }, // ❗ faqat DATE
    })
      .populate("student", "_id")
      .populate("subject", "_id")
      .lean();

    // ============================================
    // 4) Attendance ham faqat ISO Date
    // ============================================
    const rawAttendance = await Attendance.find({
      class: classId,
      date: { $gte: start, $lt: end },
    })
      .populate("student", "_id")
      .populate("subject", "_id")
      .lean();

    // ============================================
    // 5) MAP → studentId → subjectId → value
    // ============================================
    const grades = {};
    const attendance = {};

    rawGrades.forEach((g) => {
      const sId = g.student._id.toString();
      const subId = g.subject._id.toString();

      if (!grades[sId]) grades[sId] = {};
      grades[sId][subId] = g.value;
    });

    rawAttendance.forEach((a) => {
      const sId = a.student._id.toString();
      const subId = a.subject._id.toString();

      if (!attendance[sId]) attendance[sId] = {};
      attendance[sId][subId] = a.status;
    });

    // ============================================
    // 6) Students
    // ============================================
    const students = cls.students.map((s) => ({
      _id: s._id,
      name: `${s.first_name} ${s.last_name}`,
    }));

    // ============================================
    // 7) Subjects
    // ============================================
    const subjectsFormatted = subjects.map((s) => ({
      _id: s._id,
      name: s.name,
      teacher: s.teacher
        ? `${s.teacher.first_name} ${s.teacher.last_name}`
        : "No Teacher",
    }));

    // ============================================
    // RESPONSE
    // ============================================
    res.json({
      date,
      class: { _id: cls._id, name: cls.name },
      students,
      subjects: subjectsFormatted,
      grades,
      attendance,
    });
  } catch (err) {
    console.error("Daily Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
