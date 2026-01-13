const mongoose = require("mongoose");
const MenuItem = require("../models/menuItem");
const Category = require("../models/category");
const { MONGO_URL } = require("../configuration/configuration");

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Очистити існуючі дані
    await MenuItem.deleteMany({});
    await Category.deleteMany({});

    // Створити категорії
    const categories = await Category.insertMany([
      { key: "rolls", label: "Роли", isActive: true },
      { key: "sushi", label: "Суші", isActive: true },
      { key: "drinks", label: "Напої", isActive: true },
    ]);

    // Створити товари
    const menuItems = await MenuItem.insertMany([
      {
        name: "Філадельфія",
        description: "Класичний рол з лососем та крем-сиром",
        price: 250,
        image: "",
        category: "rolls",
        weight: 300,
        weightUnit: "g",
        isAvailable: true,
      },
      {
        name: "Каліфорнія",
        description: "Рол з крабом та авокадо",
        price: 220,
        image: "",
        category: "rolls",
        weight: 280,
        weightUnit: "g",
        isAvailable: true,
      },
    ]);

    console.log(`Created ${categories.length} categories`);
    console.log(`Created ${menuItems.length} menu items`);

    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seed();
