// const express = require("express");
// const subject = require("../models/subject");
// const Grade = require("../models/grade");

// const router = express.Router();

// // ✅ Fan qo‘shish (faqat teacher qo‘shadi)

// // 🔹 Fan qo‘shish (faqat director)
// router.post("/", async (req, res) => {
//   try {
//     if (req.role !== "director") {
//       return res
//         .status(403)
//         .json({ message: "Faqat direktor fan qo‘sha oladi" });
//     }

//     const { name, classId, teacherId } = req.body;

//     if (!name || !classId || !teacherId) {
//       return res.status(400).json({ message: "Barcha maydonlar majburiy" });
//     }

//     const subject_name = new subject({
//       name,
//       teacher: teacherId,
//       class: classId,
//     });

//     await subject_name.save();

//     res
//       .status(201)
//       .json({ message: "Fan muvaffaqiyatli qo‘shildi", subject_name });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Fan qo‘shishda xatolik", error: error.message });
//   }
// });

// module.exports = router;

// // ✅ Sinfdagi barcha fanlarni olish
// router.get("/class/:classId", async (req, res) => {
//   try {
//     const subjects = await Subject.find({ class: req.params.classId }).populate(
//       "teacher",
//       "first_name last_name"
//     );

//     res.json({ subjects });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching subjects", error: error.message });
//   }
// });

// // ✅ O‘qituvchining o‘z fanlarini olish
// router.get("/my-subjects", async (req, res) => {
//   try {
//     const subjects = await subject
//       .find({ teacher: req.user })
//       .populate("class", "name year") // sinf ma'lumotlari
//       .lean(); // plain JS objectga o'tkazish

//     // har bir subject uchun grades qo‘shish
//     const subjectsWithGrades = await Promise.all(
//       subjects.map(async (subj) => {
//         const grades = await Grade.find({ subject: subj._id })
//           .populate("student", "first_name last_name")
//           .lean();
//         return { ...subj, grades };
//       })
//     );

//     res.json({ subjects: subjectsWithGrades });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching my subjects", error: error.message });
//   }
// });

// module.exports = router;

// routes/subjects.js
const express = require("express");
const Subject = require("../models/subject");
const Grade = require("../models/grade");
const User = require("../models/user");

const router = express.Router();

// ✅ Barcha subjectlarni olish (director uchun)
// ✅ Barcha subjectlarni olish (director uchun)
router.get("/", async (req, res) => {
  try {
    if (req.role !== "director") {
      return res.status(403).json({ message: "Faqat direktor ko‘ra oladi" });
    }

    const subjects = await Subject.find()
      .populate("teacher", "first_name last_name")
      .populate("class", "name year");

    res.json({ subjects });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching all subjects",
      error: error.message,
    });
  }
});

// 🔹 Director qo‘shadigan fanlar
router.post("/", async (req, res) => {
  try {
    if (req.role !== "director") {
      return res
        .status(403)
        .json({ message: "Faqat direktor fan qo‘sha oladi" });
    }

    const { name, classId, teacherId } = req.body;
    if (!name || !classId || !teacherId) {
      return res.status(400).json({ message: "Barcha maydonlar majburiy" });
    }

    const subject = new Subject({
      name,
      teacher: teacherId,
      class: classId,
    });

    await subject.save();
    res.status(201).json({ message: "Fan muvaffaqiyatli qo‘shildi", subject });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Fan qo‘shishda xatolik", error: error.message });
  }
});

// 🔹 Sinfdagi barcha fanlar va ularning baholari bilan birga
router.get("/my-subjects", async (req, res) => {
  try {
    const subjects = await Subject.find({ teacher: req.user })
      .populate({
        path: "class",
        select: "name year students",
        populate: {
          path: "students",
          select: "first_name last_name",
        },
      })
      .lean();

    // Har bir subjectga baholarni qo‘shish
    const subjectsWithGrades = await Promise.all(
      subjects.map(async (subj) => {
        const grades = await Grade.find({ subject: subj._id })
          .populate("student", "first_name last_name")
          .lean();

        // Har bir studentga uning baholarini qo‘shish
        const studentsWithGrades = (subj.class.students || []).map(
          (student) => {
            const studentGrades = grades
              .filter(
                (g) => g.student?._id.toString() === student?._id.toString()
              )
              .map((g) => ({
                _id: g._id,
                value: g.value,
                date: g.date,
              }));

            return { ...student, grades: studentGrades };
          }
        );

        return {
          ...subj,
          class: { ...subj.class, students: studentsWithGrades },
        };
      })
    );

    res.json({ subjects: subjectsWithGrades });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching my subjects", error: error.message });
  }
});

module.exports = router;
