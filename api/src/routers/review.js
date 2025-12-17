const express = require("express");
const Review = require("../models/review");
const router = new express.Router();

// Отримати всі схвалені відгуки
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true }).sort({
      createdAt: -1,
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Створити новий відгук
router.post("/", async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Схвалити відгук (адмін)
router.patch("/:id/approve", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
