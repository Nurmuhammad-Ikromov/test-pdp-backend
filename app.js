const express = require("express");
const cors = require("cors");

const testRouter = require("./routes/test");
const userRouter = require("./routes/teachers");
const examRouter = require("./routes/exam");
const classRouter = require("./routes/class");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const gradeRouter = require("./routes/grade");
const subjectRouter = require("./routes/subject");
const attendanceRouter = require("./routes/attendanceRouter");
const directorRouter = require("./routes/director");
const authMiddleware = require("./middlewares/auth");

require("dotenv").config();

const app = express();

app.use(express.json());

// ✅ CORS konfiguratsiya
app.use(
  cors({
    origin: "*", // faqat frontend domeniga ruxsat
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight (OPTIONS) uchun handler
app.options(
  "*",
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ ROUTES
app.use("/test", authMiddleware, testRouter);
app.use("/teacher", userRouter);
app.use("/exams", authMiddleware, examRouter);
app.use("/class", authMiddleware, classRouter);
app.use("/attendance", authMiddleware, attendanceRouter);
app.use("/auth", authRoutes);
app.use("/students", authMiddleware, studentRoutes);
app.use("/grades", authMiddleware, gradeRouter);
app.use("/subjects", authMiddleware, subjectRouter);
app.use("/director", authMiddleware, directorRouter);

module.exports = app;
