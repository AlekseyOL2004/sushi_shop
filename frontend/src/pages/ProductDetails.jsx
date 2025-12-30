import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import "./ProductDetails.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const CATEGORIES = {
  rolls: { label: "Роли", icon: "🍱", color: "#667eea" },
  sushi: { label: "Суші", icon: "🍣", color: "#48bb78" },
  sets: { label: "Сети", icon: "🎁", color: "#ed8936" },
  soups: { label: "Супи", icon: "🍜", color: "#e53e3e" },
  drinks: { label: "Напої", icon: "🥤", color: "#4299e1" },
  desserts: { label: "Десерти", icon: "🍰", color: "#9f7aea" },
};

const WEIGHT_UNITS = {
  g: { label: "грамів", icon: "⚖️", short: "г" },
  l: { label: "літрів", icon: "🧃", short: "л" },
  pcs: { label: "штук", icon: "🔢", short: "шт" },
};

export default function ProductDetails() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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
    fetchProduct();
  }, [productId, navigate]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menu/${productId}`);
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      alert("Помилка завантаження товару: " + error.message);
      navigate("/products/manage");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !product) {
    return <div className="loading">Завантаження...</div>;
  }

  const weightUnit = WEIGHT_UNITS[product.weightUnit] || WEIGHT_UNITS.g;

  return (
    <div className="product-details-container">
      <Header />

      <div className="product-details-card">
        <header className="details-header-sub">
          <button
            onClick={() => navigate("/products/manage")}
            className="back-btn-sub"
          >
            ← Назад до списку
          </button>
          <h1>Детальна інформація про товар</h1>
          <button
            onClick={() => navigate(`/products/edit/${productId}`)}
            className="edit-btn-sub"
          >
            ✏️ Редагувати
          </button>
        </header>

        <div className="details-content">
          <div className="details-main">
            <div className="product-image-large">{product.image}</div>

            <div className="product-header-info">
              <h2>{product.name}</h2>
              <span
                className="category-badge-large"
                style={{ backgroundColor: CATEGORIES[product.category]?.color }}
              >
                {CATEGORIES[product.category]?.icon}{" "}
                {CATEGORIES[product.category]?.label}
              </span>
              <span
                className={`availability-badge-large ${
                  product.isAvailable ? "available" : "unavailable"
                }`}
              >
                {product.isAvailable
                  ? "✅ Доступно для замовлення"
                  : "❌ Недоступно"}
              </span>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-section">
              <h3>📝 Опис</h3>
              <p>{product.description}</p>
            </div>

            {product.ingredients && (
              <div className="detail-section">
                <h3>🥘 Інгредієнти</h3>
                <p>{product.ingredients}</p>
              </div>
            )}

            <div className="detail-section">
              <h3>💰 Ціна</h3>
              <div className="price-display">{product.price}₴</div>
            </div>

            {product.weight && (
              <div className="detail-section">
                <h3>
                  {weightUnit.icon} {product.weightUnit === "g" && "Вага"}
                  {product.weightUnit === "l" && "Об'єм"}
                  {product.weightUnit === "pcs" && "Кількість"}
                </h3>
                <p className="weight-display">
                  {product.weight} {weightUnit.label}
                </p>
              </div>
            )}

            <div className="detail-section">
              <h3>📊 Статус</h3>
              <div
                className={`status-display ${
                  product.isAvailable ? "available" : "unavailable"
                }`}
              >
                {product.isAvailable ? "Доступний" : "Недоступний"}
              </div>
            </div>

            <div className="detail-section">
              <h3>🆔 ID товару</h3>
              <code className="product-id">{product._id}</code>
            </div>

            <div className="detail-section">
              <h3>📅 Створено</h3>
              <p>
                {new Date(product.createdAt).toLocaleDateString("uk-UA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="detail-section">
              <h3>🔄 Оновлено</h3>
              <p>
                {new Date(product.updatedAt).toLocaleDateString("uk-UA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="details-actions">
            <button
              onClick={() => navigate(`/products/edit/${productId}`)}
              className="action-btn edit"
            >
              ✏️ Редагувати товар
            </button>
            <button
              onClick={() => navigate("/products/manage")}
              className="action-btn back"
            >
              📋 До списку товарів
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
