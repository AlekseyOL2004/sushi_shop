import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./ProductsManagement.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function ProductsManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

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
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && product.isAvailable) ||
      (availabilityFilter === "unavailable" && !product.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="products-management">
      <Header />

      <div className="products-container">
        <header className="products-header">
          <h1>
            <img src="/icon/goods-management.png" alt="" />
            Управління товарами
          </h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => navigate(-1)} className="back-btn-cat">
              Назад
            </button>
            <button
              onClick={() => navigate("/products/create")}
              className="create-btn"
            >
              Створити товар
            </button>
          </div>
        </header>

        <div className="filters-section">
          <input
            type="text"
            placeholder="Пошук товарів..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-box"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-filter"
          >
            <option value="all">Всі категорії</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
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
          <div className="stat-card">
            <h3>{products.filter((p) => !p.isAvailable).length}</h3>
            <p>Недоступні</p>
          </div>
        </div>

        {loading ? (
          <div className="loading">Завантаження...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-results">
            <h3>Товарів не знайдено</h3>
            <p>Спробуйте змінити параметри пошуку</p>
          </div>
        ) : (
          <div className="products-management-grid">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="management-product-card"
                onClick={() => navigate(`/products/${product._id}`)}
              >
                <div className="management-product-image">{product.image}</div>
                <div className="management-product-info">
                  <h3>{product.name}</h3>
                  <span
                    className="management-category-badge"
                    style={{
                      background: categories.find((c) => c.key === product.category)
                        ? "linear-gradient(135deg, #1c879e 0%, #00c2a5 100%)"
                        : "#1c879e",
                    }}
                  >
                    {categories.find((c) => c.key === product.category)?.label ||
                      product.category}
                  </span>
                  <p className="management-product-description">{product.description}</p>
                  <p className="management-product-weight">
                    {product.weight} {product.weightUnit || "г"}
                  </p>
                  <div className="management-product-footer">
                    <span className="management-product-price">{product.price}₴</span>
                    <span
                      className={`management-availability-badge ${
                        product.isAvailable ? "available" : "unavailable"
                      }`}
                    >
                      {product.isAvailable ? "Доступний" : "Недоступний"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
