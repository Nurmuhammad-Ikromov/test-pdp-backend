const app = require("./app");
const mongoose = require("mongoose");

const mongoURL =
  "mongodb+srv://nurmuhammadikromov58:Nurmuhammad1612@chat.g0qtc0r.mongodb.net/?retryWrites=true&w=majority&appName=Chat";

const PORT = process.env.PORT || 3000;

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB ulanishi muvaffaqiyatli amalga oshirildi");
    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishlamoqda`);
    });
  })
  .catch((err) => console.error("MongoDB ulanishida xatolik yuz berdi:", err));
