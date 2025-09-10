// scripts/migrateStudents.js
const mongoose = require("mongoose");
const Class = require("../models/class");
const { User } = require("../models/user");
// 🔥 o'z DB nomingizni yozing

async function migrate() {
  try {
    await mongoose.connect(
      "mongodb+srv://abbos:zPS4yWZIsges947f@cluster0.adosdaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ MongoDB connected");

    const users = await User.find({ role: "student" });

    console.log(`Found ${users.length} students`);

    for (let user of users) {
      // 1) Agar eski "class" maydoni bo‘lsa
      if (user.class) {
        await Class.findByIdAndUpdate(user.class, {
          $addToSet: { students: user._id },
        });
      }

      // 2) Agar yangi "classes" massivida bo‘lsa
      if (user.classes && user.classes.length > 0) {
        for (let classId of user.classes) {
          await Class.findByIdAndUpdate(classId, {
            $addToSet: { students: user._id },
          });
        }
      }
    }
  } catch (err) {
    console.error("❌ Migration failed", err);
    process.exit(1);
  }
}

migrate();
