const mongoose = require("mongoose");
const Category = require("./models/category");
const { mongoURL } = require("./configuration/index");

const defaultCategories = [
  {
    key: "rolls",
    label: "Роли",
    icon: "🍱",
    color: "#667eea",
    isActive: true,
  },
  {
    key: "sushi",
    label: "Суші",
    icon: "🍣",
    color: "#48bb78",
    isActive: true,
  },
  {
    key: "sets",
    label: "Сети",
    icon: "🎁",
    color: "#ed8936",
    isActive: true,
  },
  {
    key: "soups",
    label: "Супи",
    icon: "🍜",
    color: "#e53e3e",
    isActive: true,
  },
  {
    key: "drinks",
    label: "Напої",
    icon: "🥤",
    color: "#4299e1",
    isActive: true,
  },
  {
    key: "desserts",
    label: "Десерти",
    icon: "🍰",
    color: "#9f7aea",
    isActive: true,
  },
];

async function seedCategories() {
  try {
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    // Перевірити чи вже існують категорії
    const existingCount = await Category.countDocuments();

    if (existingCount > 0) {
      console.log(`ℹ️ Database already has ${existingCount} categories`);
      console.log("Do you want to:");
      console.log("1. Skip seeding");
      console.log("2. Add only missing categories");
      console.log("3. Clear all and reseed");

      // Для автоматичного виконання - додаємо тільки відсутні
      console.log("\n📝 Adding only missing categories...\n");

      for (const categoryData of defaultCategories) {
        const exists = await Category.findOne({ key: categoryData.key });

        if (!exists) {
          const category = new Category(categoryData);
          await category.save();
          console.log(
            `✅ Created category: ${category.label} (${category.key})`
          );
        } else {
          console.log(
            `⏭️  Category already exists: ${exists.label} (${exists.key})`
          );
        }
      }
    } else {
      console.log("📝 Creating default categories...\n");

      for (const categoryData of defaultCategories) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`✅ Created category: ${category.label} (${category.key})`);
      }
    }

    // Показати всі категорії
    const allCategories = await Category.find().sort({ createdAt: 1 });
    console.log("\n📋 All categories in database:");
    allCategories.forEach((cat, index) => {
      console.log(
        `${index + 1}. ${cat.icon} ${cat.label} (${cat.key}) - ${
          cat.isActive ? "Active" : "Inactive"
        }`
      );
    });

    console.log("\n✅ Categories seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedCategories();
