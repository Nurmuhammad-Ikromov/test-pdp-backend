const express = require("express");
const router = express.Router();

const Class = require("../models/class");
const Grade = require("../models/grade");
const Attendance = require("../models/attendance");

// ------------------------------
// ISO kun 00:00:00.000Z funksiyasi
// ------------------------------
function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// ==============================
// 1) BULK GRADES
// ==============================
router.post("/bulk", async (req, res) => {
  try {
    const { classId, subjectId, changes } = req.body;
    const teacherId = req.user;

    for (const { studentId, date, value } of changes) {
      const d = normalizeDate(date);

      if (value === null) {
        // DELETE GRADE
        await Grade.deleteOne({
          student: studentId,
          class: classId,
          subject: subjectId,
          date: d,
        });

        // AUTO → ABSENT
        await Attendance.updateOne(
          { student: studentId, class: classId, subject: subjectId, date: d },
          { $set: { status: "absent", auto_marked: true } },
          { upsert: true }
        );
      } else {
        // UPSERT GRADE
        await Grade.findOneAndUpdate(
          {
            student: studentId,
            class: classId,
            subject: subjectId,
            date: d,
          },
          { value, teacher: teacherId },
          { upsert: true }
        );

        // AUTO → PRESENT
        await Attendance.updateOne(
          { student: studentId, class: classId, subject: subjectId, date: d },
          { $set: { status: "present", auto_marked: true } },
          { upsert: true }
        );
      }
    }

    res.json({ message: "Grades saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 2) SINGLE GRADE
// ==============================
router.post("/", async (req, res) => {
  try {
    const teacherId = req.user;
    const { studentId, classId, date, value } = req.body;
    const d = normalizeDate(date);

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const teacherObj = cls.teachers.find(
      (t) => t.teacher.toString() === teacherId.toString()
    );
    if (!teacherObj)
      return res.status(400).json({ message: "Teacher not assigned to class" });

    const subjectId = teacherObj.subject;

    await Grade.findOneAndUpdate(
      { student: studentId, class: classId, subject: subjectId, date: d },
      { $set: { value, teacher: teacherId } },
      { upsert: true }
    );

    await Attendance.updateOne(
      { student: studentId, class: classId, subject: subjectId, date: d },
      { $set: { status: "present", auto_marked: true } },
      { upsert: true }
    );

    res.json({ message: "Grade saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// GETTERS
// ==============================
router.get("/class/:classId", async (req, res) => {
  try {
    const grades = await Grade.find({
      class: req.params.classId,
      teacher: req.user,
    })
      .populate("student", "first_name last_name")
      .populate("subject", "name")
      .sort({ date: 1 });

    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:classId/:subjectId", async (req, res) => {
  try {
    const grades = await Grade.find({
      class: req.params.classId,
      subject: req.params.subjectId,
    })
      .populate("student", "first_name last_name")
      .lean();

    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/student/:studentId", async (req, res) => {
  try {
    const grades = await Grade.find({
      student: req.params.studentId,
    })
      .populate("subject", "name")
      .populate("teacher", "first_name last_name");

    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
