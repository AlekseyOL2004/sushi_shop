import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./CategoriesManagement.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

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
    icon: "",
    imageUrl: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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
        icon: category.icon || "",
        imageUrl: category.imageUrl || "",
        isActive: category.isActive,
      });
      // Додаємо API_BASE до imageUrl для preview
      const previewUrl = category.imageUrl?.startsWith('/uploads/')
        ? `${API_BASE}${category.imageUrl}`
        : category.imageUrl || "/icon/no-image.png";
      setImagePreview(previewUrl);
    } else {
      setFormData({
        key: "",
        label: "",
        icon: "",
        imageUrl: "",
        isActive: true,
      });
      setImagePreview("/icon/no-image.png");
    }
    setImageFile(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Розмір файлу не повинен перевищувати 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Оберіть файл зображення",
        }));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const categoryData = {
        key: formData.key.toLowerCase(),
        label: formData.label,
        icon: formData.icon || "",
        imageUrl: formData.imageUrl || "",
        isActive: formData.isActive,
        adminId: currentUser._id,
        adminRole: currentUser.role,
      };

      const url = editingCategory
        ? `${API_BASE}/categories/${editingCategory._id}`
        : `${API_BASE}/categories`;

      const res = await fetch(url, {
        method: editingCategory ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      await fetchCategories();
      setShowModal(false);
      setEditingCategory(null);
      setImageFile(null);
      setImagePreview("");
      setSuccessMessage(
        editingCategory
          ? "Категорію успішно оновлено!"
          : "Категорію успішно створено!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
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

      setSuccessMessage(" Категорію успішно видалено!");
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
          <div className="header-title-section">
            <img src="/icon/category.png" alt="" className="header-icon" />
            <h1>Управління категоріями</h1>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate(-1)} className="back-btn-cat">
              Назад
            </button>
            <button onClick={() => openModal()} className="create-btn-cat">
              Створити категорію
            </button>
          </div>
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
                <div key={category._id} className="category-card-simple">
                  <div className="category-info-simple">
                    <h3>{category.label}</h3>
                    <code className="category-key">{category.key}</code>
                    <span
                      className={`category-status ${
                        category.isActive ? "active" : "inactive"
                      }`}
                    >
                      {category.isActive ? "Активна" : "Неактивна"}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={() => openModal(category)}
                      className="edit-btn"
                    >
                      Редагувати
                    </button>
                    {currentUser.role === "admin" && (
                      <button
                        onClick={() => handleDelete(category)}
                        className="delete-btn"
                      >
                        Видалити
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
                Створити першу категорію
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
                  <label>
                    Ключ категорії * (тільки a-z та -)
                  </label>
                  <input
                    type="text"
                    name="key"
                    value={formData.key}
                    onChange={handleChange}
                    disabled={!!editingCategory}
                    required
                    pattern="[a-z-]+"
                    placeholder="rolls"
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
                    required
                    placeholder="Роли"
                  />
                  {errors.label && (
                    <span className="error">{errors.label}</span>
                  )}
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Категорія активна
                  </label>
                </div>

                {errors.general && (
                  <div className="error-message">{errors.general}</div>
                )}

                <div className="preview-section">
                  <h4>Попередній перегляд</h4>
                  <div className="preview-card-simple">
                    <div className="preview-info-simple">
                      <h3>{formData.label || "Назва категорії"}</h3>
                      <code className="category-key">
                        {formData.key || "key"}
                      </code>
                      <span
                        className={`category-status ${
                          formData.isActive ? "active" : "inactive"
                        }`}
                      >
                        {formData.isActive ? "Активна" : "Неактивна"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "Збереження..." : "Зберегти"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="cancel-btn"
                  >
                    Скасувати
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
