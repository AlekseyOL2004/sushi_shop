const express = require("express");
const User = require("../models/user");
const router = new express.Router();

// Реєстрація користувача (публічний маршрут)
router.post("/", async (req, res) => {
  try {
    const userData = { ...req.body };

    if (
      !userData.role ||
      !["customer", "manager", "moderator", "admin"].includes(userData.role)
    ) {
      userData.role = "customer";
    }

    if (["admin", "moderator", "manager"].includes(userData.role)) {
      userData.role = "customer";
      console.log(
        "⚠️ Attempt to register with elevated role blocked. Set to customer."
      );
    }

    const user = new User(userData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res
        .status(400)
        .json({ message: "User validation failed", details });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(400).json({ message: error.message || "Bad Request" });
  }
});

// Отримати всіх користувачів
router.get("/", async (req, res) => {
  try {
    console.log("GET /users request");
    const users = await User.find().select("-password");
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Вхід користувача (login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    let user = await User.findOne({ email }).lean();

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Невірний email або пароль" });
    }

    console.log("User from DB (raw):", JSON.stringify(user, null, 2));

    if (user.password !== password) {
      console.log("❌ Invalid password");
      return res.status(401).json({ message: "Невірний email або пароль" });
    }

    if (!user.role || user.isActive === undefined || user.isActive === null) {
      console.log("⚠️ User missing fields, updating...");

      const updates = {};
      if (!user.role) {
        updates.role = "customer";
        user.role = "customer";
      }
      if (user.isActive === undefined || user.isActive === null) {
        updates.isActive = true;
        user.isActive = true;
      }

      console.log("Updating with:", updates);
      await User.updateOne({ _id: user._id }, { $set: updates });
    }

    if (user.isActive === false) {
      console.log("❌ User deactivated");
      return res.status(403).json({
        message: "Ваш акаунт деактивовано. Зверніться до адміністратора.",
      });
    }

    const userResponse = {
      _id: user._id.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleName: user.middleName || "",
      phone: user.phone || "",
      email: user.email,
      address: user.address || "",
      birthDate: user.birthDate,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    console.log("✅ LOGIN SUCCESS - Response:");
    console.log(JSON.stringify(userResponse, null, 2));
    console.log("Role:", userResponse.role);
    console.log("IsActive:", userResponse.isActive);

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати користувача за ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Оновити роль користувача
router.patch("/:id/role", async (req, res) => {
  try {
    const { role, adminId, adminPassword } = req.body;

    console.log("=== CHANGE ROLE REQUEST ===");
    console.log("Target user ID:", req.params.id);
    console.log("New role:", role);
    console.log("Admin ID:", adminId);

    if (!adminId || !adminPassword) {
      return res.status(400).json({ message: "Admin credentials required" });
    }

    const admin = await User.findById(adminId).lean();

    if (!admin) {
      return res.status(403).json({ message: "Адміна не знайдено" });
    }

    if (admin.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Тільки адміністратори можуть змінювати ролі" });
    }

    if (admin.password !== adminPassword) {
      return res.status(401).json({ message: "Невірний пароль адміна" });
    }

    if (!["customer", "manager", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User before:", user.role);
    user.role = role;
    await user.save();
    console.log("User after:", user.role);

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(
      `✅ SUCCESS: Admin ${admin.email} changed role of ${user.email} to ${role}`
    );
    res.json(userResponse);
  } catch (error) {
    console.error("❌ Update role error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Деактивувати/активувати користувача
router.patch("/:id/status", async (req, res) => {
  try {
    const { isActive, adminId, adminPassword } = req.body;

    if (!adminId || !adminPassword) {
      return res.status(400).json({ message: "Admin credentials required" });
    }

    const admin = await User.findById(adminId).lean();

    if (!admin) {
      return res.status(403).json({ message: "Адміна не знайдено" });
    }

    if (admin.role !== "admin" && admin.role !== "moderator") {
      return res.status(403).json({ message: "Недостатньо прав доступу" });
    }

    if (admin.password !== adminPassword) {
      return res.status(401).json({ message: "Невірний пароль" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(
      `✅ Admin ${admin.email} ${isActive ? "activated" : "deactivated"} ${
        user.email
      }`
    );
    res.json(userResponse);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Видалити користувача
router.delete("/:id", async (req, res) => {
  try {
    const { adminId, adminPassword } = req.body;

    if (!adminId || !adminPassword) {
      return res.status(400).json({ message: "Admin credentials required" });
    }

    const admin = await User.findById(adminId).lean();

    if (!admin) {
      return res.status(403).json({ message: "Адміна не знайдено" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete users" });
    }

    if (admin.password !== adminPassword) {
      return res.status(401).json({ message: "Невірний пароль адміна" });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Admin ${admin.email} deleted user ${user.email}`);
    res.json({ message: "User deleted successfully", deletedUser: user.email });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Оновити профіль користувача (сам користувач або адмін)
router.patch("/:id", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      phone,
      email,
      address,
      birthDate,
      password,
    } = req.body;

    console.log("=== UPDATE PROFILE ===");
    console.log("User ID:", req.params.id);
    console.log("Update data:", { firstName, lastName, email });

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Оновити дозволені поля (НЕ роль і НЕ isActive)
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (middleName !== undefined) user.middleName = middleName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (password) user.password = password;

    // Email можна змінити тільки якщо він унікальний
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(`✅ User ${user.email} updated profile`);
    res.json(userResponse);
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
