import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./CategoriesManagement.css";

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
  "🍲",
  "🍛",
  "🥗",
  "🍕",
  "🍔",
];
const COLOR_OPTIONS = [
  { value: "#667eea", label: "Фіолетовий" },
  { value: "#48bb78", label: "Зелений" },
  { value: "#ed8936", label: "Помаранчевий" },
  { value: "#e53e3e", label: "Червоний" },
  { value: "#4299e1", label: "Синій" },
  { value: "#9f7aea", label: "Пурпурний" },
  { value: "#f6ad55", label: "Жовтий" },
  { value: "#fc8181", label: "Рожевий" },
];

export default function CategoriesManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    icon: "🍱",
    color: "#667eea",
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

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
      setLoading(true);
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        key: category.key,
        label: category.label,
        icon: category.icon,
        color: category.color,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        key: "",
        label: "",
        icon: "🍱",
        color: "#667eea",
        isActive: true,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.key.trim()) {
      newErrors.key = "Введіть ключ категорії";
    } else if (!/^[a-z_]+$/.test(formData.key)) {
      newErrors.key = "Ключ може містити тільки маленькі літери та _";
    }

    if (!formData.label.trim()) newErrors.label = "Введіть назву категорії";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const categoryData = {
        ...formData,
        adminId: currentUser._id,
        adminRole: currentUser.role,
      };

      let res;
      if (editingCategory) {
        res = await fetch(`${API_BASE}/categories/${editingCategory._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        });
      } else {
        res = await fetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoryData),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка збереження категорії");
      }

      setSuccessMessage(
        editingCategory
          ? "✅ Категорію успішно оновлено!"
          : "✅ Категорію успішно створено!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      await fetchCategories();
      closeModal();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category) => {
    if (
      !window.confirm(
        `Ви впевнені що хочете видалити категорію "${category.label}"?`
      )
    ) {
      return;
    }

    if (currentUser.role !== "admin") {
      alert("Тільки адміністратори можуть видаляти категорії");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories/${category._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser._id,
          adminRole: currentUser.role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка видалення категорії");
      }

      setSuccessMessage("✅ Категорію успішно видалено!");
      setTimeout(() => setSuccessMessage(""), 3000);

      await fetchCategories();
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="categories-management">
      <Header />

      <div className="categories-content">
        <header className="categories-header-sub">
          <h1>Управління категоріями</h1>
          <button onClick={() => openModal()} className="create-btn">
            ➕ Створити категорію
          </button>
        </header>

        {successMessage && (
          <div className="success-banner">{successMessage}</div>
        )}

        <div className="categories-container">
          <div className="stats-section">
            <div className="stat-card">
              <h3>{categories.length}</h3>
              <p>Всього категорій</p>
            </div>
            <div className="stat-card">
              <h3>{categories.filter((c) => c.isActive).length}</h3>
              <p>Активні</p>
            </div>
            <div className="stat-card">
              <h3>{categories.filter((c) => !c.isActive).length}</h3>
              <p>Неактивні</p>
            </div>
          </div>

          {loading && !showModal ? (
            <div className="loading">Завантаження...</div>
          ) : (
            <div className="categories-grid">
              {categories.map((category) => (
                <div key={category._id} className="category-card">
                  <div
                    className="category-icon-large"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <div className="category-info">
                    <h3>{category.label}</h3>
                    <code className="category-key">{category.key}</code>
                    <div
                      className="category-color-badge"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.color}
                    </div>
                    <span
                      className={`category-status ${
                        category.isActive ? "active" : "inactive"
                      }`}
                    >
                      {category.isActive ? "✅ Активна" : "❌ Неактивна"}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={() => openModal(category)}
                      className="edit-btn"
                    >
                      ✏️ Редагувати
                    </button>
                    {currentUser.role === "admin" && (
                      <button
                        onClick={() => handleDelete(category)}
                        className="delete-btn"
                      >
                        🗑️ Видалити
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && categories.length === 0 && (
            <div className="no-results">
              <p>Категорій не знайдено</p>
              <button onClick={() => openModal()} className="create-btn-large">
                ➕ Створити першу категорію
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>
                {editingCategory
                  ? "Редагувати категорію"
                  : "Створити категорію"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Ключ категорії * (тільки a-z та _)</label>
                  <input
                    type="text"
                    name="key"
                    value={formData.key}
                    onChange={handleChange}
                    placeholder="rolls"
                    disabled={!!editingCategory}
                    required
                  />
                  {errors.key && <span className="error">{errors.key}</span>}
                </div>

                <div className="form-group">
                  <label>Назва категорії *</label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    placeholder="Роли"
                    required
                  />
                  {errors.label && (
                    <span className="error">{errors.label}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Іконка</label>
                    <select
                      name="icon"
                      value={formData.icon}
                      onChange={handleChange}
                    >
                      {EMOJI_OPTIONS.map((emoji) => (
                        <option key={emoji} value={emoji}>
                          {emoji}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Колір</label>
                    <select
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                    >
                      {COLOR_OPTIONS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                    <div
                      className="color-preview"
                      style={{ backgroundColor: formData.color }}
                    ></div>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <span>Категорія активна</span>
                  </label>
                </div>

                {errors.general && (
                  <div className="error-message">❌ {errors.general}</div>
                )}

                <div className="preview-section">
                  <h4>Попередній перегляд</h4>
                  <div
                    className="preview-badge"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon} {formData.label}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "⏳ Збереження..." : "💾 Зберегти"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="cancel-btn"
                  >
                    ❌ Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
