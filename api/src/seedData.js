const mongoose = require("mongoose");
const MenuItem = require("./models/menuItem");
const Review = require("./models/review");
const { mongoURL } = require("./configuration/index");

const menuItems = [
  {
    name: "Філадельфія",
    price: 280,
    image: "🍣",
    description: "Лосось, сир вершковий, огірок",
  },
  {
    name: "Каліфорнія",
    price: 250,
    image: "🍱",
    description: "Краб, авокадо, ікра масаго",
  },
  {
    name: "Дракон",
    price: 320,
    image: "🐉",
    description: "Вугор, огірок, авокадо, унагі соус",
  },
  {
    name: "Сяке Маки",
    price: 180,
    image: "🍣",
    description: "Лосось, рис, норі",
  },
  {
    name: "Техас",
    price: 290,
    image: "🌶️",
    description: "Курка, сир, гострий соус",
  },
  {
    name: "Тунець Спайсі",
    price: 310,
    image: "🔥",
    description: "Тунець, спайсі соус, кунжут",
  },
];

const reviews = [
  {
    name: "Олена К.",
    rating: 5,
    text: "Найсвіжіша риба! Доставка за 30 хвилин. Рекомендую!",
    approved: true,
  },
  {
    name: "Андрій М.",
    rating: 5,
    text: "Ціни адекватні, якість на висоті. Замовляємо постійно.",
    approved: true,
  },
  {
    name: "Марія Т.",
    rating: 5,
    text: "Смачно, красиво, швидко. Що ще потрібно?",
    approved: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(mongoURL);
    console.log("Connected to MongoDB");

    // Очистити існуючі дані
    await MenuItem.deleteMany({});
    await Review.deleteMany({});
    console.log("Cleared existing data");

    // Додати нові дані
    await MenuItem.insertMany(menuItems);
    await Review.insertMany(reviews);
    console.log("Data seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
