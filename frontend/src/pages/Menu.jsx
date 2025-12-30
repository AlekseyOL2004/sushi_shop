import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Menu.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const WEIGHT_UNITS = {
  g: { short: "г", icon: "⚖️" },
  l: { short: "л", icon: "🧃" },
  pcs: { short: "шт", icon: "🔢" },
};

export default function Menu() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Завантажити кошик з localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/menu`),
        fetch(`${API_BASE}/categories?active=true`),
      ]);

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData.filter((item) => item.isAvailable));
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i._id === item._id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((i) =>
        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Статистика по категоріях
  const categoryStats = {};
  menuItems.forEach((item) => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });

  // Знайти категорію за ключем
  const getCategoryData = (key) => {
    return (
      categories.find((cat) => cat.key === key) || {
        label: key,
        icon: "📦",
        color: "#667eea",
      }
    );
  };

  const selectedCategoryData =
    selectedCategory === "all"
      ? { label: "Всі товари", icon: "🍱", color: "#667eea" }
      : getCategoryData(selectedCategory);

  return (
    <div className="menu-page">
      <Header
        cartCount={cartCount}
        onCartClick={() =>
          alert(`У кошику ${cart.length} позицій (${cartCount} товарів)`)
        }
      />

      <div className="menu-container">
        <aside className="menu-sidebar">
          <h3>Категорії</h3>
          <div className="category-filters">
            {/* Категорія "Всі" */}
            <button
              className={`category-btn ${
                selectedCategory === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedCategory("all")}
              style={{
                borderColor: selectedCategory === "all" ? "#667eea" : "#e2e8f0",
                backgroundColor:
                  selectedCategory === "all" ? "#667eea20" : "white",
              }}
            >
              <span className="category-icon">🍱</span>
              <span className="category-name">Всі товари</span>
              <span className="category-count">{menuItems.length}</span>
            </button>

            {/* Категорії з БД */}
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`category-btn ${
                  selectedCategory === cat.key ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  borderColor:
                    selectedCategory === cat.key ? cat.color : "#e2e8f0",
                  backgroundColor:
                    selectedCategory === cat.key ? `${cat.color}20` : "white",
                }}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.label}</span>
                <span className="category-count">
                  {categoryStats[cat.key] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="search-section">
            <h3>Пошук</h3>
            <input
              type="text"
              placeholder=" Знайти товар..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </aside>

        <main className="menu-main">
          <div className="menu-top">
            <h2>
              {selectedCategoryData.icon} {selectedCategoryData.label}
            </h2>
            <p className="items-count">
              Знайдено: <strong>{filteredItems.length}</strong> товарів
            </p>
          </div>

          {loading ? (
            <div className="loading">Завантаження...</div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map((item) => {
                const itemCategory = getCategoryData(item.category);
                const weightUnit =
                  WEIGHT_UNITS[item.weightUnit] || WEIGHT_UNITS.g;

                return (
                  <div key={item._id} className="menu-item-card">
                    <div
                      className="item-image"
                      onClick={() => navigate(`/product/${item._id}`)}
                      style={{ cursor: "pointer" }}
                      title="Переглянути деталі"
                    >
                      {item.image}
                    </div>
                    <div className="item-info">
                      <h3
                        onClick={() => navigate(`/product/${item._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        {item.name}
                      </h3>
                      <span
                        className="item-category"
                        style={{ backgroundColor: itemCategory.color }}
                      >
                        {itemCategory.icon} {itemCategory.label}
                      </span>
                      <p className="item-description">{item.description}</p>
                      {item.weight && (
                        <p className="item-weight">
                          {weightUnit.icon} {item.weight}
                          {weightUnit.short}
                        </p>
                      )}
                      {item.ingredients && (
                        <p className="item-ingredients">
                          <strong>Інгредієнти:</strong> {item.ingredients}
                        </p>
                      )}
                      <div className="item-footer">
                        <span className="item-price">{item.price}₴</span>
                        <div className="item-actions">
                          <button
                            onClick={() => navigate(`/product/${item._id}`)}
                            className="details-btn"
                          >
                            👁️ Деталі
                          </button>
                          <button
                            onClick={() => addToCart(item)}
                            className="add-to-cart-btn"
                          >
                            + Додати
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Нічого не знайдено</h3>
              <p>Спробуйте змінити категорію або пошуковий запит</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
