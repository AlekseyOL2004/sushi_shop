import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import "./ProductDetails.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const WEIGHT_UNITS = {
  g: "г",
  l: "л",
  pcs: "шт"
};

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]); // Змінено з id на productId

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menu/${productId}`); // Змінено з id на productId
      if (!res.ok) throw new Error("Товар не знайдено");
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Не вдалося завантажити категорії");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Помилка завантаження категорій:", error);
    }
  };

  const getIngredientsArray = () => {
    if (!product || !product.ingredients) return [];

    if (Array.isArray(product.ingredients)) {
      return product.ingredients;
    }

    if (typeof product.ingredients === "string") {
      return product.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/menu/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser._id,
          adminRole: currentUser.role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка видалення товару");
      }

      alert("✅ Товар успішно видалено!");
      navigate("/products/manage");
    } catch (error) {
      alert("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Завантаження...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">Товар не знайдено</div>;

  return (
    <div className="product-details-page">
      <Header />

      <div className="product-details-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Назад
        </button>

        <div className="product-details-card">
          {/* Ліва колонка */}
          <div className="product-left-column">
            <div className="product-details-header">
              <h1 className="product-title">{product.name}</h1>
              <p className="product-price">{product.price}₴</p>
              <div className="product-badges">
                <span className="category-badge">
                  {categories.find((c) => c.key === product.category)?.label ||
                    product.category}
                </span>
                <span
                  className={`availability-badge ${
                    product.isAvailable ? "available" : "unavailable"
                  }`}
                >
                  {product.isAvailable ? "Доступний" : "Недоступний"}
                </span>
              </div>
            </div>

            <div className="product-image-large">{product.image}</div>
          </div>

          {/* Права колонка */}
          <div className="product-right-column">
            <div className="product-details-body">
              <div className="product-content-grid">
                <div className="product-section full-width">
                  <h2 className="section-title">
                    <img src="/icon/reviews.png" alt="" className="section-icon" />
                    Опис
                  </h2>
                  <p className="product-description-text">{product.description}</p>
                </div>

                {getIngredientsArray().length > 0 && (
                  <div className="product-section">
                    <h2 className="section-title">
                      <img src="/icon/average-check.png" alt="" className="section-icon" />
                      Інгредієнти
                    </h2>
                    <ul className="ingredients-list">
                      {getIngredientsArray().map((ingredient, index) => (
                        <li key={index} className="ingredient-tag">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="product-section">
                  <h2 className="section-title">
                    <img src="/icon/scale.png" alt="" className="section-icon" />
                    Вага
                  </h2>
                  <div className="weight-info">
                    <span className="weight-icon">⚖️</span>
                    <p className="weight-text">
                      <span>{product.weight}</span> {WEIGHT_UNITS[product.weightUnit] || "г"}
                    </p>
                  </div>
                </div>

                {currentUser &&
                  (currentUser.role === "admin" ||
                    currentUser.role === "moderator" ||
                    currentUser.role === "manager") && (
                    <div className="product-section full-width">
                      <h2 className="section-title">
                        <img src="/icon/admin-panel.png" alt="" className="section-icon" />
                        Технічна інформація
                      </h2>
                      <div className="technical-info">
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-label">ID товару</span>
                            <span className="info-value">{product._id}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Створено</span>
                            <span className="info-value">
                              {new Date(product.createdAt).toLocaleString("uk-UA")}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Оновлено</span>
                            <span className="info-value">
                              {new Date(product.updatedAt).toLocaleString("uk-UA")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {currentUser &&
              (currentUser.role === "admin" ||
                currentUser.role === "moderator") && (
                <div className="product-actions">
                  <button
                    onClick={() => navigate(`/products/edit/${product._id}`)}
                    className="edit-btn"
                  >
                    Редагувати
                  </button>
                  {currentUser.role === "admin" && (
                    <button onClick={() => setShowDeleteModal(true)} className="delete-btn">
                      Видалити
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Модалка підтвердження видалення */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-delete">
              <h2>Підтвердження видалення</h2>
            </div>
            <div className="modal-body-delete">
              <p>
                Ви впевнені, що хочете видалити товар{" "}
                <strong>"{product.name}"</strong>?
              </p>
              <p className="warning-text-delete">
                Цю дію не можна буде скасувати!
              </p>
            </div>
            <div className="modal-actions-delete">
              <button
                onClick={handleDelete}
                className="confirm-delete-btn"
                disabled={loading}
              >
                {loading ? "Видалення..." : "Так, видалити"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="cancel-delete-btn"
                disabled={loading}
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
