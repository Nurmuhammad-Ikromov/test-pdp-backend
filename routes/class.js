const express = require("express");
const Class = require("../models/class"); // Class modelini import qilish
const { User } = require("../models/user"); // User modelini import qilish

const router = express.Router();

// 1. Create (Yangi sinf qo'shish)
router.post("/", async (req, res) => {
  try {
    const { name, year, students } = req.body;

    const newClass = new Class({
      name,
      year: year || new Date().getFullYear(),
      students,
    });

    await newClass.save();
    res
      .status(201)
      .json({ message: "Class created successfully", class: newClass });
  } catch (error) {
    res.status(500).json({ message: "Error creating class", error });
  }
});

// 2. Read All (Barcha sinflarni olish)
router.get("/", async (req, res) => {
  try {
    const classes = await Class.find({ status: true }).populate(
      "students",
      "first_name last_name username"
    );
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes", error });
  }
});

// 🔹 O‘qituvchining sinflari (faqat teacher uchun)
router.get("/my-classes", async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(403).json({ message: "Faqat o‘qituvchilar uchun" });
    }

    // Foydalanuvchini olish + sinflarini populate qilish
    const teacher = await User.findById(req.user).populate({
      path: "classes",
      populate: [
        { path: "students", select: "first_name last_name username" },
        { path: "teachers", select: "first_name last_name username" },
      ],
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ classes: teacher.classes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes", error });
  }
});

// 3. Read One (Bitta sinfni olish)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await Class.findById(id).populate(
      "students",
      "first_name last_name username"
    );

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching class", error });
  }
});

// 4. Update (Sinfni yangilash)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      { _id: id, status: true },
      updates,
      {
        new: true,
      }
    ).populate("students", "first_name last_name username");

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res
      .status(200)
      .json({ message: "Class updated successfully", class: updatedClass });
  } catch (error) {
    res.status(500).json({ message: "Error updating class", error });
  }
});

// 5. Delete (Sinfni o'chirish)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedClass = await Class.findOneAndUpdate(
      { _id: id, status: true },
      { status: false }
    );

    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting class", error });
  }
});

// 6. Add Student to Class (Sinfga o'quvchi qo'shish)
router.post("/:id/add-student", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    if (classData.students.includes(studentId)) {
      return res.status(400).json({ message: "Student already in class" });
    }

    classData.students.push(studentId);
    await classData.save();

    student.class = classData._id;
    await student.save();
    res.status(200).json({
      message: "Student added to class successfully",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding student to class", error });
  }
});

// 7. Remove Student from Class (Sinfdan o'quvchini o'chirish)
router.post("/:id/remove-student", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (!classData.students.includes(studentId)) {
      return res.status(400).json({ message: "Student not in class" });
    }

    classData.students = classData.students.filter(
      (s) => s.toString() !== studentId
    );
    await classData.save();

    res.status(200).json({
      message: "Student removed from class successfully",
      class: classData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing student from class", error });
  }
});

const Grade = require("../models/grade");

// 🔹 O‘quvchiga baho qo‘yish
router.post("/:classId/grade", async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(403).json({ message: "Faqat o‘qituvchilar uchun" });
    }

    const { studentId, grade } = req.body;
    const { classId } = req.params;

    // Tekshirish: student shu sinfda bormi?
    const classData = await Class.findById(classId);
    if (!classData || !classData.students.includes(studentId)) {
      return res.status(400).json({ message: "O‘quvchi bu sinfda emas" });
    }

    const newGrade = new Grade({
      student: studentId,
      teacher: req.user,
      class: classId,
      grade,
    });

    await newGrade.save();
    res.status(201).json({ message: "Baho qo‘yildi", grade: newGrade });
  } catch (error) {
    res.status(500).json({ message: "Error setting grade", error });
  }
});

// 🔹 O‘quvchining baholarini olish
router.get("/:classId/grades/:studentId", async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const grades = await Grade.find({ class: classId, student: studentId })
      .populate("teacher", "first_name last_name")
      .sort({ date: -1 });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: "Error fetching grades", error });
  }
});

router.post("/:classId/assign-teacher/:teacherId", async (req, res) => {
  try {
    if (req.role !== "director") {
      return res
        .status(403)
        .json({ message: "Faqat direktor biriktira oladi" });
    }

    const { classId, teacherId } = req.params;

    // Class modeliga qo‘shish
    await Class.findByIdAndUpdate(classId, {
      $addToSet: { teachers: teacherId },
    });

    // User modeliga qo‘shish
    await User.findByIdAndUpdate(teacherId, {
      $addToSet: { classes: classId },
    });

    res.json({ message: "O‘qituvchi sinfga biriktirildi" });
  } catch (error) {
    res.status(500).json({ message: "Error assigning teacher", error });
  }
});

router.delete("/:classId/remove-teacher/:teacherId", async (req, res) => {
  try {
    if (req.role !== "director") {
      return res
        .status(403)
        .json({ message: "Faqat direktor o‘qituvchini olib tashlashi mumkin" });
    }

    const { classId, teacherId } = req.params;

    // Class modelidan o‘qituvchini olib tashlash
    await Class.findByIdAndUpdate(classId, {
      $pull: { teachers: teacherId },
    });

    // User modelidan sinfni olib tashlash
    await User.findByIdAndUpdate(teacherId, {
      $pull: { classes: classId },
    });

    res.json({ message: "O‘qituvchi sinfdan o‘chirildi" });
  } catch (error) {
    res.status(500).json({ message: "Error removing teacher", error });
  }
});

module.exports = router;
