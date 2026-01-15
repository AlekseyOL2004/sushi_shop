const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = new express.Router();

// Створюємо папку для збереження файлів
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Налаштування multer для збереження файлів
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "image-" + uniqueSuffix + ext);
  },
});

// Фільтр для перевірки типу файлу
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Тільки зображення дозволені (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Ендпоінт для завантаження зображення
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не завантажено" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    console.log(` Image uploaded: ${req.file.filename}`);
    
    res.json({
      imageUrl: imageUrl,
      message: "Зображення успішно завантажено",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Обробка помилок multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Файл занадто великий (макс. 5MB)" });
    }
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

module.exports = router;
