const mongoose = require("mongoose");
const User = require("./models/user");
const { mongoURL } = require("./configuration/index");

async function fixUsers() {
  try {
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    // Знайти всіх користувачів
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    let fixed = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updates = {};

      // Перевірити role
      if (!user.role) {
        updates.role = "customer";
        needsUpdate = true;
      }

      // Перевірити isActive
      if (user.isActive === undefined || user.isActive === null) {
        updates.isActive = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        console.log(`✅ Fixed user: ${user.email}`, updates);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} users`);

    // Показати всіх користувачів
    const allUsers = await User.find().select("-password");
    console.log("\n📋 All users:");
    allUsers.forEach((user) => {
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

fixUsers();
