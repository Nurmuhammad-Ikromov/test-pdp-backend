// routes/gradeRouter.js
const express = require("express");
const router = express.Router();
const { User } = require("../models/user"); // agar kerak bo'lsa
const Class = require("../models/class");
const Subject = require("../models/subject");
const Grade = require("../models/grade");
const { default: mongoose } = require("mongoose");

// --- POST: create or update (upsert) grade ---
// Body: { studentId, classId, subjectId, date (YYYY-MM-DD), value }

// routes/grades.js

// POST /grades/bulk
router.post("/bulk", async (req, res) => {
  try {
    const { classId, subjectId, changes } = req.body;
    const teacherId = req.user;

    for (const { studentId, date, value } of changes) {
      const normalizedDate = new Date(date).toISOString().split("T")[0];

      if (value === null) {
        // 🔥 Agar "-" tanlangan bo‘lsa — bahoni o‘chiramiz
        await Grade.deleteOne({
          student: studentId,
          class: classId,
          subject: subjectId,
          date: normalizedDate,
        });
      } else {
        // Bahoni qo‘shish yoki yangilash
        await Grade.findOneAndUpdate(
          {
            student: studentId,
            class: classId,
            subject: subjectId,
            date: normalizedDate,
            teacher: teacherId,
          },
          { value },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ message: "Grades saved ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const teacherId = req.user;
    const { studentId, classId, date, value } = req.body;

    if (!studentId || !classId || !date || value == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // normalize date
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Teacherning shu classdagi subjectini olish
    const teacherObj = cls.teachers.find(
      (t) => t.teacher.toString() === teacherId.toString()
    );
    if (!teacherObj)
      return res
        .status(400)
        .json({ message: "Teacher not assigned to this class" });

    const subjectId = teacherObj.subject;

    // Grade upsert
    const filter = {
      student: studentId,
      class: classId,
      subject: subjectId,
      date: d,
    };
    const update = {
      $set: { value, teacher: teacherId, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    };
    const opts = { new: true, upsert: true };

    const grade = await Grade.findOneAndUpdate(filter, update, opts)
      .populate("student", "first_name last_name")
      .populate("subject", "name")
      .populate("teacher", "first_name last_name");

    res.status(200).json({ message: "Grade saved", grade });
  } catch (err) {
    res.status(500).json({ message: "Error saving grade", error: err.message });
  }
});

router.get("/class/:classId", async (req, res) => {
  console.log(req.user);

  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid classId" });
    }

    const grades = await Grade.find({ class: classId, teacher: req.user })
      .populate("student", "first_name last_name")
      .populate("subject", "name")
      .populate("teacher", "first_name last_name")
      .sort({ date: 1 });

    console.log("grades found:", grades.length);

    return res.status(200).json({ grades });
  } catch (err) {
    console.error("GET /grades/class/:classId error:", err);
    return res.status(500).json({
      message: "Error fetching grades",
      error: err.message,
    });
  }
});

// GET /grades/:classId/:subjectId
router.get("/:classId/:subjectId", async (req, res) => {
  try {
    const { classId, subjectId } = req.params;

    const grades = await Grade.find({ class: classId, subject: subjectId })
      .populate("student", "first_name last_name")
      .lean();

    res.json({ grades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
});

// GET /grades/student/:studentId
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const grades = await Grade.find({ student: studentId })
      .populate("subject", "name")
      .populate("teacher", "first_name last_name")
      .lean();

    res.json({ grades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
});

// --- GET: all grades for a class (teacher/dir/admin) ---

// --- GET: logged-in student's grades ---
router.get("/my", async (req, res) => {
  try {
    const studentId = req.user; // tokendagi id

    // ensure role maybe student, but we can still return
    const grades = await Grade.find({ student: studentId })
      .populate("subject", "name")
      .populate("teacher", "first_name last_name")
      .sort({ date: -1 });

    return res.status(200).json({ grades });
  } catch (err) {
    console.error("GET /grades/my error:", err);
    return res
      .status(500)
      .json({ message: "Error fetching your grades", error: err.message });
  }
});

// --- GET: specific student (by id) all grades (for teacher/admin) ---
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const grades = await Grade.find({ student: studentId })
      .populate("subject", "name")
      .populate("teacher", "first_name last_name")
      .sort({ date: -1 });

    return res.status(200).json({ grades });
  } catch (err) {
    console.error("GET /grades/student/:studentId error:", err);
    return res
      .status(500)
      .json({ message: "Error fetching student grades", error: err.message });
  }
});

module.exports = router;
