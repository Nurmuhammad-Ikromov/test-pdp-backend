const multer = require('multer')
const express = require('express')
const Test = require('../models/test')
const {
  testEncodings,
  encodeMsgpackBase64,
  decodeMsgpackBase64
} = require('../utils/coding') // Import encoding function
const {
  parseWordFile,
  validateQuestions,
  calculatePercentage
} = require('../utils/word')
const fs = require('fs').promises
const path = require('path')
const { User } = require('../models/user')
const router = express.Router()
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${Date.now()}${ext}`)
  }
})

const upload = multer({ storage: storage })
router.get('/all', async (req, res) => {
  const userId = req.user; // Middleware orqali qo‘shilgan user ID

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    // Testlar ro‘yxatini olish
    const [tests, total] = await Promise.all([
      Test.find({ status: true })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // oxirgi qo‘shilgan testlar birinchi chiqadi
      Test.countDocuments({ status: true, who: userId }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: tests,
    });
  } catch (error) {
    console.error('Testlarni olishda xatolik:', error);
    res.status(500).json({
      success: false,
      message: 'Testlarni olishda xatolik yuz berdi',
    });
  }
});

// Fayl yuklash uchun endpoint
router.post('/create', upload.single('file'), async (req, res) => {
  const { title, type } = req.body // req.body dan mavzuni olish
  // console.log(type)
  let userId = req.user
  if (!req.file || !title) {
    return res.status(400).json({ error: 'Fayl yoki mavzu kiritilmadi' })
  }

  try {
    const questions = await parseWordFile(req.file.path)

    // console.log('Process started')
    const encodedData = encodeMsgpackBase64(questions)

    // console.log('Process ended')

    // Testni bazaga saqlash
    const newTest = new Test({
      title, // decode qilib saqlanadi
      questions,
      who: userId,
      type,
      encodedData: encodedData.replace('==', '') // base64 kodlangan holda saqlanadi
    })

    await newTest.save()

    console.timeEnd('Process Duration')
    await fs.unlink(req.file.path) // Yuklangan faylni o'chirish
    res.json({
      message: 'Test muvaffaqiyatli saqlandi',
      success: true,
      link: newTest._id
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Faylni qayta ishlashda xatolik yuz berdi' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, status: true })
    // console.log(test)
    if (!test) {
      res.status(404).json({ message: 'Test topilmadi', success: false })
    }
    res.json({
      test: decodeMsgpackBase64(test.encodedData),
      success: true,
      title: test.title
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Xato so'rov", success: false })
  }
})

router.delete('/:id', async (req, res) => {
  const userId = req.user; // foydalanuvchi ID
  try {
    // Testni bazadan topamiz
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test topilmadi',
      });
    }
    console.log(test.who.toString())
    console.log(userId)
    console.log(test.who.toString() !== userId)
    // Faqat test egasigina o‘chira oladi
    if (test.who.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Siz bu testni o‘chirishga ruxsatingiz yo‘q',
      });
    }

    // O‘chirish o‘rniga status: false qilib qo‘yamiz (soft delete)
    await Test.findByIdAndUpdate(req.params.id, { status: false });

    res.status(200).json({
      success: true,
      message: 'Test muvaffaqiyatli o‘chirildi',
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Testni o‘chirishda xatolik yuz berdi',
    });
  }
});
module.exports = router
