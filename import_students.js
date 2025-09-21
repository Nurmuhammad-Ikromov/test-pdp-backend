// import_students.js
require("dotenv").config();
const xlsx = require("xlsx");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const { User } = require("./models/user"); // <-- sizning User model faylini chaqiring
const Class = require("./models/class");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://nurmuhammadikromov58:Nurmuhammad1612@chat.g0qtc0r.mongodb.net/?retryWrites=true&w=majority&appName=Chat";

// classId har doim shu bo‘ladi (siz aytgansiz)
const CLASS_ID = new mongoose.Types.ObjectId("68d0364cc2383c0de562a4e4");

// --- Parol generator ---
function randPassword(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// username: familiya + ism harfi
async function generateUniqueUsername(lastName, firstName) {
  const base = (lastName + "." + (firstName[0] || "")).toLowerCase();
  let username = base;
  let i = 0;
  while (await User.exists({ username })) {
    i++;
    username = base + i;
  }
  return username;
}

async function importFromExcel(filePath) {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDBga ulandik");

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
  });

  const csvWriter = createCsvWriter({
    path: "generated_credentials.csv",
    header: [
      { id: "fullName", title: "Full Name" },
      { id: "username", title: "Username" },
      { id: "password", title: "Password" },
      { id: "class", title: "Class" },
    ],
  });

  const credentialsOutput = [];

  for (const row of rows) {
    const fish = String(row.Fish || "").trim();
    const sinf = String(row.Sinf || "").trim();

    if (!fish) continue;

    // F.I.Sh bo‘lishi: [Familiya] [Ism] [Otasining ismi...]
    const parts = fish.split(/\s+/);
    const lastName = parts[0] || "";
    const firstName = parts[1] || "";
    const fullName = parts.join(" ");

    const username = await generateUniqueUsername(lastName, firstName);
    const plainPassword = randPassword(8);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const userDoc = new User({
      first_name: firstName,
      last_name: lastName,
      username,
      role: "student",
      password: passwordHash,
      active: true,
      class: CLASS_ID, // hammasi shu sinfga biriktiriladi
    });

    try {
      await userDoc.save();

      // Class modeliga ham studentni qo‘shamiz
      await Class.findByIdAndUpdate(CLASS_ID, {
        $push: { students: userDoc._id },
      });

      console.log("Created user:", username);
      credentialsOutput.push({
        fullName,
        username,
        password: plainPassword,
        class: sinf,
      });
    } catch (err) {
      console.error("❌ Xatolik:", fullName, err.message);
    }
  }

  await csvWriter.writeRecords(credentialsOutput);
  console.log("📂 generated_credentials.csv tayyor bo‘ldi");

  await mongoose.disconnect();
  console.log("✅ MongoDB aloqasi yopildi.");
}

const fileArg = process.argv[2];
if (!fileArg) {
  console.error(
    "❌ Iltimos: node import_students.js students.xlsx tarzida fayl nomini bering."
  );
  process.exit(1);
}

importFromExcel(fileArg).catch((err) => {
  console.error("Import xatolik:", err);
  process.exit(1);
});
