const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../models/user') // User modelini import qilish
const authMiddleware = require('../middlewares/auth')
const { default: mongoose } = require('mongoose')
const Class = require('../models/class')
const ResponseExam = require('../models/response')
require('dotenv').config() // .env faylini o'qish

const router = express.Router()

// JWT uchun maxfiy kalit
const SECRET_KEY = process.env.SECRET_KEY

// 1. Signup (Ro'yxatdan o'tish)
router.post('/signup', async (req, res) => {
  try {
    const { first_name, last_name, username, password, role } = req.body

    // Username tekshirish
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10)

    // Yangi o'qituvchi yaratish
    const teacher = new User({
      first_name,
      last_name,
      username,
      role,
      password: hashedPassword
    })
    // console.log(teacher)

    await teacher.save()
    res.status(201).json({ message: 'Teacher registered successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error registering teacher', error })
  }
})
router.post('/add', async (req, res) => {
  try {
    const { first_name, last_name, username, password, role, classId } = req.body

    // Username tekshirish
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // Parolni hash qilish
    const hashedPassword = await bcrypt.hash(password, 10)

    // Yangi o'qituvchi yaratish
    const teacher = new User({
      first_name,
      last_name,
      username,
      role,
      password: hashedPassword,
      class: classId
    })
    // console.log(teacher)

    await teacher.save()
    res.status(201).json({ message: 'Teacher registered successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error registering teacher', error })
  }
})

// 2. Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    console.log({ username, password })
    // Foydalanuvchini topish
    const user = await User.findOne({ username })
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    // Parolni tekshirish
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // JWT token yaratish
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: '1d'
    })
    delete user.password

    res.status(200).json({ message: 'Login successful', token, user })
  } catch (error) {
    // console.log(error)
    res.status(500).json({ message: 'Error logging in', error })
  }
})

router.get('/profile', authMiddleware, async (req, res) => {
  let role = req.role
  let userId = req.user
  console.log(userId)
  try {
    let studentClass
    let user
    if (role === 'student') {
      user = await User.findById(userId)
      // console.log(user)
      studentClass = await Class.findOne({ _id: user?.class }).populate({
        path: 'exams',
        select: '-encodedData' // encodedData ni yashiradi
      })
      // user = await User.findById(req.user)
    } else if (role === 'teacher') {
      user = await User.findById(req.user, { password: 0 })
    }
    let grades = await ResponseExam.find({ who: user }).populate({ path: "exam", select: "-encodedData" });
    return res.json({
      user: { user, grades },
      aviableExamine: studentClass?.exams
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({ message: 'Error fetching user profile', error })
  }
})
router.get('/users', authMiddleware, async (req, res) => {
  let role = req.role
  try {
    if (role !== 'student') {
      const user = await User.find(
        { active: true, role: 'student' },
        { password: 0 }
      )
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json({ user })
    } else {
      return res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error })
  }
})
module.exports = router
