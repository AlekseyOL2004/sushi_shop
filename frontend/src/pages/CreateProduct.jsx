import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ImageUpload from "../components/ImageUpload";
import Toast from "../components/Toast";
import "./ProductForm.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const WEIGHT_UNITS = {
  g: { label: "Грами (г)", icon: "" },
  l: { label: "Літри (л)", icon: "" },
  pcs: { label: "Штуки (шт)", icon: "" },
};

export default function CreateProduct() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: null,
    category: "",
    ingredients: "",
    weight: "",
    weightUnit: "g",
    isAvailable: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories?active=true`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, category: data[0].key }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
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

    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        weight: formData.weight ? Number(formData.weight) : null,
        imageUrl: formData.imageUrl,
        adminId: currentUser._id,
        adminRole: currentUser.role,
      };

      const res = await fetch(`${API_BASE}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка створення товару");
      }

      const newProduct = await res.json();
      setToastMessage(`Товар "${newProduct.name}" успішно створено!`);
      setShowToast(true);
      
      setTimeout(() => {
        navigate("/products/manage");
      }, 2000);
    } catch (error) {
      setErrors({ general: error.message });
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  const selectedCategoryData =
    categories.find((cat) => cat.key === formData.category) || {};

  return (
    <div className="product-form-container">
      <Header />

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          type="success"
        />
      )}

      <div className="product-form-wrapper">
        <div className="product-form-card">
          <header className="form-header">
            <h1>Створити новий товар</h1>
            <button
              onClick={() => navigate("/products/manage")}
              className="back-btn"
            >
              Назад до списку
            </button>
          </header>

          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Назва товару *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Наприклад: Філадельфія"
                required
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Категорія *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.length === 0 ? (
                  <option value="">Немає доступних категорій</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))
                )}
              </select>
              {categories.length === 0 && (
                <span className="error">
                  Створіть категорії на сторінці{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/categories")}
                    style={{ color: "#1c879e", textDecoration: "underline" }}
                  >
                    Управління категоріями
                  </button>
                </span>
              )}
            </div>

            <ImageUpload
              currentImageUrl={formData.imageUrl}
              onImageChange={(url) => setFormData({ ...formData, imageUrl: url })}
              onImageDelete={() => setFormData({ ...formData, imageUrl: null })}
            />

            <div className="form-group">
              <label>Опис *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Опишіть товар..."
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
                placeholder="Лосось, рис, норі, крем-сир..."
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
                  placeholder="0"
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
                placeholder="0"
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
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Створення..." : "Створити товар"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/products/manage")}
              >
                Скасувати
              </button>
            </div>

            <div className="preview-section">
              <h3>Попередній перегляд</h3>
              <div className="preview-card">
                <div className="preview-image" style={{ width: "150px", height: "150px", margin: "0 auto" }}>
                  {formData.imageUrl ? (
                    <img
                      src={`${API_BASE}${formData.imageUrl}`}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <img
                      src="/icon/no-image.png"
                      alt="No image"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>
                <h4>{formData.name || "Назва товару"}</h4>
                <p
                  className="preview-category"
                  style={{ backgroundColor: selectedCategoryData.color }}
                >
                  {selectedCategoryData.label}
                </p>
                <p className="preview-description">
                  {formData.description || "Опис товару"}
                </p>
                {formData.weight && (
                  <p className="preview-weight">
                    {formData.weight}
                    {formData.weightUnit === "g" && "г"}
                    {formData.weightUnit === "l" && "л"}
                    {formData.weightUnit === "pcs" && "шт"}
                  </p>
                )}
                <div className="preview-footer">
                  <span className="preview-price">{formData.price || 0}₴</span>
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
    </div>
  );
}
