const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config(); // .env faylini o'qish

const SECRET_KEY = process.env.SECRET_KEY;
const authMiddleware = (req, res, next) => {
  // Authorization header'ni olish
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer <token>"dan faqat tokenni olish

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  // Tokenni tekshirish
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    // Decoded token bilan foydalanuvchi ma'lumotlarini req object'iga qo'shish
    req.user = decoded.id;
    req.role = decoded.role;

    next(); // Keyingi middleware yoki marshrutga o'tish
  });
};

module.exports = authMiddleware;
