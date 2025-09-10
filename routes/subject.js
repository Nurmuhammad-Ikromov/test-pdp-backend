const express = require("express");
const Subject = require("../models/subject");

const router = express.Router();

// ✅ Fan qo‘shish (faqat teacher qo‘shadi)
router.post("/", async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Faqat o‘qituvchi fan qo‘sha oladi" });
    }

    const { name, classId } = req.body;

    const subject = new Subject({
      name,
      teacher: req.user, // token ichidan teacher ID
      class: classId,
    });

    await subject.save();

    res.status(201).json({ message: "Fan muvaffaqiyatli qo‘shildi", subject });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating subject", error: error.message });
  }
});

// ✅ Sinfdagi barcha fanlarni olish
router.get("/class/:classId", async (req, res) => {
  try {
    const subjects = await Subject.find({ class: req.params.classId }).populate(
      "teacher",
      "first_name last_name"
    );

    res.json({ subjects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching subjects", error: error.message });
  }
});

// ✅ O‘qituvchining o‘z fanlarini olish
router.get("/my-subjects", async (req, res) => {
  try {
    const subjects = await Subject.find({ teacher: req.user }).populate(
      "class",
      "name year"
    );
    res.json({ subjects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching my subjects", error: error.message });
  }
});

module.exports = router;
