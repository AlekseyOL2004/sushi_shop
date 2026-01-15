const mongoose = require("mongoose");
const User = require("./models/user");
const { mongoURL } = require("./configuration/index");

async function updateExistingUsers() {
  try {
    await mongoose.connect(mongoURL);
    console.log(" Connected to MongoDB");

    // Оновити всіх користувачів без поля role
    const result = await User.updateMany(
      { role: { $exists: false } },
      {
        $set: {
          role: "customer",
          isActive: true,
        },
      }
    );

    console.log(
      ` Updated ${result.modifiedCount} users with default role and status`
    );

    // Показати всіх користувачів
    const users = await User.find().select("-password");
    console.log("\n📋 Current users:");
    users.forEach((user) => {
      console.log(
        `- ${user.email}: ${user.role} (${
          user.isActive ? "active" : "inactive"
        })`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateExistingUsers();
