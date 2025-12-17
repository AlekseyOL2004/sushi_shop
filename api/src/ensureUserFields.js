const mongoose = require("mongoose");
const User = require("./models/user");
const { mongoURL } = require("./configuration/index");

async function ensureUserFields() {
  try {
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    const result = await User.updateMany(
      {
        $or: [{ role: { $exists: false } }, { isActive: { $exists: false } }],
      },
      {
        $set: {
          role: "customer",
          isActive: true,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);

    const users = await User.find({}, { email: 1, role: 1, isActive: 1 });
    console.log("\n📋 All users:");
    users.forEach((user) => {
      console.log(
        `- ${user.email}: role=${user.role}, isActive=${user.isActive}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

ensureUserFields();
