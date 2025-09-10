const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../models/user') // User modelini import qilish
require('dotenv').config() // .env faylini o'qish

const router = express.Router()


// 3. Create (Yangi o'qituvchi qo'shish)
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, username, password } = req.body

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10)

    const teacher = new User({
      first_name,
      last_name,
      username,
      role: 'teacher',
      password: hashedPassword
    })

    await teacher.save()
    res.status(201).json({ message: 'Teacher created successfully', teacher })
  } catch (error) {
    res.status(500).json({ message: 'Error creating teacher', error })
  }
})

// 4. Read (O'qituvchilarni olish)
router.get('/', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
    res.status(200).json(teachers)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error })
  }
})

// 5. Update (O'qituvchini yangilash)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const updatedTeacher = await User.findByIdAndUpdate(id, updates, {
      new: true
    })

    if (!updatedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    res
      .status(200)
      .json({ message: 'Teacher updated successfully', updatedTeacher })
  } catch (error) {
    res.status(500).json({ message: 'Error updating teacher', error })
  }
})

// 6. Delete (O'qituvchini o'chirish)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const deletedTeacher = await User.findByIdAndUpdate(id, { status: false })

    if (!deletedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    res.status(200).json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error })
  }
})

// router.get('/my-exams', async (req, res) => {
//   let userid = req.user || '67811fe45c20084d6212a2a3'
//   try {
//     let exams = await User.findById(userid).populate('exams')
//     res.send(exams)
//   } catch (error) {}
// })

module.exports = router
