const express = require("express");
const Review = require("../models/review");
const User = require("../models/user");
const router = new express.Router();

// Отримати всі відгуки
router.get("/", async (req, res) => {
  try {
    const { limit, approved } = req.query;

    const filter = {};
    if (approved === "true") {
      filter.isApproved = true;
    }

    let query = Review.find(filter)
      .populate({
        path: "userId",
        select: "firstName lastName",
      })
      .populate({
        path: "products",
        select: "name image imageUrl price",
      })
      .sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const reviews = await query;

    // Фільтруємо відгуки, видаляючи ті, де userId не існує
    const validReviews = reviews
      .filter((review) => review.userId != null)
      .map((review) => {
        // Фільтруємо products, залишаючи тільки ті, що існують
        const validProducts = review.products.filter(
          (product) => product != null
        );

        return {
          _id: review._id,
          userId: review.userId,
          name: review.name,
          rating: review.rating,
          text: review.text,
          products: validProducts,
          isApproved: review.isApproved,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      });

    res.json(validReviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати відгук за ID
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate({
        path: "userId",
        select: "firstName lastName",
      })
      .populate({
        path: "products",
        select: "name image imageUrl price",
      });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (!review.userId) {
      return res.status(404).json({ message: "Review author not found" });
    }

    // Фільтруємо products
    const validProducts = review.products.filter((product) => product != null);

    const validReview = {
      _id: review._id,
      userId: review.userId,
      name: review.name,
      rating: review.rating,
      text: review.text,
      products: validProducts,
      isApproved: review.isApproved,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };

    res.json(validReview);
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Створити відгук
router.post("/", async (req, res) => {
  try {
    const { userId, name, rating, text, products } = req.body;

    if (!userId || !name || !rating || !text) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const review = new Review({
      userId,
      name,
      rating,
      text,
      products: products || [],
    });

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate({
        path: "userId",
        select: "firstName lastName",
      })
      .populate({
        path: "products",
        select: "name image imageUrl",
      });

    console.log(`✅ New review created by ${name}`);
    res.status(201).json(populatedReview);
  } catch (error) {
    console.error("Create review error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Оновити відгук
router.patch("/:id", async (req, res) => {
  try {
    const { userId, rating, text, products } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (review.userId.toString() !== userId && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (rating) review.rating = rating;
    if (text) review.text = text;
    if (products !== undefined) review.products = products;

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate({
        path: "userId",
        select: "firstName lastName",
      })
      .populate({
        path: "products",
        select: "name image imageUrl",
      });

    console.log(`✅ Review ${review._id} updated`);
    res.json(updatedReview);
  } catch (error) {
    console.error("Update review error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Видалити відгук
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (review.userId.toString() !== userId && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await Review.findByIdAndDelete(req.params.id);

    console.log(`✅ Review ${req.params.id} deleted`);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
