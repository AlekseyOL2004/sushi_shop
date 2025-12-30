import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./ProductsManagement.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const WEIGHT_UNITS = {
  g: { short: "г", icon: "⚖️" },
  l: { short: "л", icon: "🧃" },
  pcs: { short: "шт", icon: "🔢" },
};

const CATEGORIES = {
  rolls: { label: "Роли", icon: "🍱", color: "#667eea" },
  sushi: { label: "Суші", icon: "🍣", color: "#48bb78" },
  sets: { label: "Сети", icon: "🎁", color: "#ed8936" },
  soups: { label: "Супи", icon: "🍜", color: "#e53e3e" },
  drinks: { label: "Напої", icon: "🥤", color: "#4299e1" },
  desserts: { label: "Десерти", icon: "🍰", color: "#9f7aea" },
};

export default function ProductsManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAvailable, setFilterAvailable] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "moderator") {
      navigate("/");
      return;
    }
    setCurrentUser(user);
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;

    const matchesAvailable =
      filterAvailable === "all" ||
      (filterAvailable === "available" && product.isAvailable) ||
      (filterAvailable === "unavailable" && !product.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailable;
  });

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="products-management">
      <Header />

      <div className="products-content">
        <header className="products-header-sub">
          <h1>Управління товарами</h1>
          <button
            onClick={() => navigate("/products/create")}
            className="create-btn"
          >
            ➕ Створити товар
          </button>
        </header>

        <div className="products-container">
          <div className="filters-section">
            <input
              type="text"
              placeholder="🔍 Пошук товарів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-box"
            />

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="category-filter"
            >
              <option value="all">Всі категорії</option>
              {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </select>

            <select
              value={filterAvailable}
              onChange={(e) => setFilterAvailable(e.target.value)}
              className="availability-filter"
            >
              <option value="all">Всі товари</option>
              <option value="available">Доступні</option>
              <option value="unavailable">Недоступні</option>
            </select>
          </div>

          <div className="stats-section">
            <div className="stat-card">
              <h3>{products.length}</h3>
              <p>Всього товарів</p>
            </div>
            <div className="stat-card">
              <h3>{products.filter((p) => p.isAvailable).length}</h3>
              <p>Доступні</p>
            </div>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <div key={key} className="stat-card">
                <h3>{products.filter((p) => p.category === key).length}</h3>
                <p>{label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="loading">Завантаження...</div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const categoryData = CATEGORIES[product.category] || {
                  label: "Інше",
                  icon: "❓",
                  color: "#ccc",
                };
                const weightUnit =
                  WEIGHT_UNITS[product.weightUnit] || WEIGHT_UNITS.g;

                return (
                  <div
                    key={product._id}
                    className="product-card"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <div className="product-image">{product.image}</div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: categoryData.color }}
                      >
                        {categoryData.icon} {categoryData.label}
                      </span>
                      <p className="product-description">
                        {product.description}
                      </p>
                      {product.weight && (
                        <p className="product-weight">
                          {weightUnit.icon} {product.weight}
                          {weightUnit.short}
                        </p>
                      )}
                      <div className="product-footer">
                        <span className="product-price">{product.price}₴</span>
                        <span
                          className={`availability-badge ${
                            product.isAvailable ? "available" : "unavailable"
                          }`}
                        >
                          {product.isAvailable ? "✅ Доступно" : "❌ Немає"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="no-results">Товарів не знайдено</div>
          )}
        </div>
      </div>
    </div>
  );
}
