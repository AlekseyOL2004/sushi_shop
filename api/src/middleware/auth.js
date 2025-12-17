const User = require("../models/user");

// Middleware для перевірки ролей
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // В реальному проекті тут буде JWT токен з userId
      const userId = req.headers["x-user-id"];

      if (!userId) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No user ID provided" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Forbidden: User is inactive" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: `Forbidden: Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Server error in auth middleware" });
    }
  };
};

// Перевірка чи користувач є адміном або модератором
const isAdminOrModerator = checkRole("admin", "moderator");

// Перевірка чи користувач є менеджером, модератором або адміном
const isStaff = checkRole("manager", "moderator", "admin");

// Тільки адмін
const isAdmin = checkRole("admin");

module.exports = {
  checkRole,
  isAdminOrModerator,
  isStaff,
  isAdmin,
};
