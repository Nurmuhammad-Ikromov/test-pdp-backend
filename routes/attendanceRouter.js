const router = require("express").Router();
const Attendance = require("../models/attendance");

function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// ==================================
// 1) BULK SAVE attendance
// ==================================
router.post("/bulk", async (req, res) => {
  try {
    const { classId, subjectId, changes } = req.body;

    const ops = changes.map(({ studentId, date, status }) => {
      const d = normalizeDate(date); // 🟢 ISO UTC 00:00

      return {
        updateOne: {
          filter: {
            student: studentId,
            class: classId,
            subject: subjectId,
            date: d,
          },
          update: {
            $set: { status, auto_marked: false },
          },
          upsert: true,
        },
      };
    });

    if (ops.length > 0) await Attendance.bulkWrite(ops);

    res.json({ message: "Attendance saved", count: ops.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================================
// 2) LIST — selected dates bo‘yicha
// ==================================
router.get("/list", async (req, res) => {
  try {
    const { classId, subjectId, dates } = req.query;
    if (!dates) return res.json({});

    // Frontdan kelgan date stringlar → DATE
    const normalizedDates = dates.split(",").map((d) => normalizeDate(d));

    const rows = await Attendance.find({
      class: classId,
      subject: subjectId,
      date: { $in: normalizedDates },
    }).lean();

    const result = {};

    rows.forEach((r) => {
      // Key → "YYYY-MM-DD"
      const key = r.date.toISOString().split("T")[0];

      if (!result[key]) result[key] = {};
      result[key][r.student.toString()] = r.status;
    });

    return res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
