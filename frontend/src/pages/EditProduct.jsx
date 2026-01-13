import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import "./ProductForm.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const EMOJI_OPTIONS = [
  "🍱",
  "🍣",
  "🍤",
  "🍙",
  "🍜",
  "🥤",
  "🍰",
  "🎁",
  "🥢",
  "🍵",
];

const WEIGHT_UNITS = {
  g: { label: "Грами (г)", icon: "" },
  l: { label: "Літри (л)", icon: "" },
  pcs: { label: "Штуки (шт)", icon: "" },
};

export default function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "🍣",
    category: "",
    ingredients: "",
    weight: "",
    weightUnit: "g",
    isAvailable: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    fetchData();
  }, [productId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productRes] = await Promise.all([
        fetch(`${API_BASE}/categories?active=true`),
        fetch(`${API_BASE}/menu/${productId}`),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (!productRes.ok) throw new Error("Product not found");

      const product = await productRes.json();

      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        ingredients: product.ingredients || "",
        weight: product.weight || "",
        weightUnit: product.weightUnit || "g",
        isAvailable: product.isAvailable,
      };

      setFormData(productData);
      setOriginalData(productData);
    } catch (error) {
      alert("Помилка завантаження товару: " + error.message);
      navigate("/products/manage");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Введіть назву товару";
    if (!formData.description.trim()) newErrors.description = "Введіть опис";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Введіть коректну ціну";
    if (formData.weight && formData.weight <= 0)
      newErrors.weight = "Вага має бути більше 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasChanges()) {
      setErrors({ general: "Дані не були змінені" });
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        weight: formData.weight ? Number(formData.weight) : null,
        adminId: currentUser._id,
        adminRole: currentUser.role,
      };

      const res = await fetch(`${API_BASE}/menu/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка оновлення товару");
      }

      const updatedProduct = await res.json();
      setOriginalData(formData);
      setSuccessMessage("✅ Товар успішно оновлено!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name] || errors.general) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  const getCategoryData = (key) => {
    return (
      categories.find((cat) => cat.key === key) || {
        label: key,
        icon: "📦",
        color: "#667eea",
      }
    );
  };

  if (loading || !originalData)
    return <div className="loading">Завантаження...</div>;

  const selectedCategoryData = getCategoryData(formData.category);

  return (
    <div className="product-form-container">
      <Header />

      <div className="product-form-wrapper">
        <div className="product-form-card">
          <header className="form-header">
            <h1>Редагувати товар</h1>
          </header>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Назва товару *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Категорія *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={categories.length === 0}
                >
                  {categories.length === 0 ? (
                    <option value="">Завантаження категорій...</option>
                  ) : (
                    <>
                      {categories.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.label}
                        </option>
                      ))}
                      {formData.category &&
                        !categories.find(
                          (cat) => cat.key === formData.category
                        ) && (
                          <option value={formData.category} disabled>
                            ⚠️ {formData.category} (неактивна категорія)
                          </option>
                        )}
                    </>
                  )}
                </select>
                {categories.length > 0 &&
                  formData.category &&
                  !categories.find((cat) => cat.key === formData.category) && (
                    <span className="warning-text">
                      ⚠️ Поточна категорія "{formData.category}" неактивна або
                      видалена.{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/categories")}
                        style={{
                          color: "#1c879e",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Перейти до категорій
                      </button>
                    </span>
                  )}
              </div>

              <div className="form-group">
                <label>Іконка</label>
                <select
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <option key={emoji} value={emoji}>
                      {emoji}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Опис *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
              />
              {errors.description && (
                <span className="error">{errors.description}</span>
              )}
            </div>

            <div className="form-group">
              <label>Інгредієнти</label>
              <textarea
                name="ingredients"
                value={formData.ingredients}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ціна (₴) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
                {errors.price && <span className="error">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label>Одиниця виміру</label>
                <select
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleChange}
                >
                  {Object.entries(WEIGHT_UNITS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                {formData.weightUnit === "g" && "Вага (г)"}
                {formData.weightUnit === "l" && "Об'єм (л)"}
                {formData.weightUnit === "pcs" && "Кількість (шт)"}
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="0"
                step={formData.weightUnit === "l" ? "0.01" : "1"}
              />
              {errors.weight && <span className="error">{errors.weight}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                />
                <span>Товар доступний для замовлення</span>
              </label>
            </div>

            {errors.general && (
              <div
                className={
                  errors.general.includes("не були змінені")
                    ? "warning-message"
                    : "error-message"
                }
              >
                {errors.general}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Збереження..." : "Зберегти зміни"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/products/manage")}
              >
                Скасувати
              </button>
            </div>

            {/* Додаткові дії */}
            <div className="additional-actions">
              <button
                type="button"
                onClick={() => navigate("/products/manage")}
                className="back-action-btn"
              >
                Назад до списку
              </button>
              {currentUser.role === "admin" && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="delete-action-btn"
                  disabled={loading}
                >
                  Видалити товар
                </button>
              )}
            </div>

            <div className="preview-section">
              <h3>Попередній перегляд</h3>
              <div className="preview-card">
                <div className="preview-image">{formData.image}</div>
                <h4>{formData.name}</h4>
                <p
                  className="preview-category"
                  style={{ backgroundColor: selectedCategoryData.color }}
                >
                  {selectedCategoryData.label}
                </p>
                <p className="preview-description">{formData.description}</p>
                {formData.weight && (
                  <p className="preview-weight">
                    {formData.weight}
                    {formData.weightUnit === "g" && "г"}
                    {formData.weightUnit === "l" && "л"}
                    {formData.weightUnit === "pcs" && "шт"}
                  </p>
                )}
                <div className="preview-footer">
                  <span className="preview-price">{formData.price}₴</span>
                  <span
                    className={`preview-status ${
                      formData.isAvailable ? "available" : "unavailable"
                    }`}
                  >
                    {formData.isAvailable ? "Доступно" : "Немає"}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Модалка підтвердження видалення */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-delete">
              {/* <img src="/icon/warning.png" alt="" className="warning-icon" /> */}
              <h2>Підтвердження видалення</h2>
            </div>
            <div className="modal-body-delete">
              <p>
                Ви впевнені, що хочете видалити товар{" "}
                <strong>"{formData.name}"</strong>?
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
