import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Profile.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const ROLES = {
  customer: { label: "Клієнт", color: "#48bb78" },
  manager: { label: "Менеджер", color: "#4299e1" },
  moderator: { label: "Модератор", color: "#ed8936" },
  admin: { label: "Адміністратор", color: "#e53e3e" },
};

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    email: "",
    address: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userData);
    setCurrentUser(user);

    const initialData = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      middleName: user.middleName || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      password: "",
      confirmPassword: "",
    };

    setFormData(initialData);
    setOriginalData(initialData);
  }, [navigate]);

  const hasChanges = () => {
    const fieldsToCheck = [
      "firstName",
      "lastName",
      "middleName",
      "phone",
      "email",
      "address",
      "birthDate",
    ];

    for (const field of fieldsToCheck) {
      const original = originalData[field] || "";
      const current = formData[field] || "";

      if (original.trim() !== current.trim()) {
        return true;
      }
    }

    if (formData.password && formData.password.trim()) {
      return true;
    }

    return false;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Введіть ім'я";
    if (!formData.lastName.trim()) newErrors.lastName = "Введіть прізвище";

    const phoneRegex = /^[\+]?[0-9]{10,13}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Введіть коректний номер телефону";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Введіть коректну електронну пошту";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Пароль повинен містити мінімум 6 символів";
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не збігаються";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("=== PROFILE FORM SUBMIT ===");
    console.log("isEditing:", isEditing);

    if (!isEditing) {
      console.log("❌ Not in editing mode");
      return;
    }

    if (!hasChanges()) {
      console.log("❌ No changes detected");
      setErrors({
        general: "Дані не були змінені. Внесіть зміни перед збереженням.",
      });
      return;
    }

    if (!validateForm()) {
      console.log("❌ Validation failed");
      return;
    }

    console.log("✅ Proceeding with update...");
    setLoading(true);
    setErrors({});

    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        birthDate: formData.birthDate,
      };

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }

      console.log("Updating profile:", currentUser._id);

      const res = await fetch(`${API_BASE}/users/${currentUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка оновлення");
      }

      const updatedUser = await res.json();

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      const newData = {
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        middleName: updatedUser.middleName || "",
        phone: updatedUser.phone || "",
        email: updatedUser.email || "",
        address: updatedUser.address || "",
        birthDate: updatedUser.birthDate
          ? updatedUser.birthDate.split("T")[0]
          : "",
        password: "",
        confirmPassword: "",
      };

      setFormData(newData);
      setOriginalData(newData);

      setIsEditing(false);
      setSuccessMessage("Профіль успішно оновлено!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.general) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  const handleEdit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("=== EDIT MODE ACTIVATED ===");
    setIsEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    console.log("=== EDIT MODE CANCELLED ===");
    setFormData({ ...originalData, password: "", confirmPassword: "" });
    setIsEditing(false);
    setErrors({});
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/");
  };

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="profile-page">
      <Header />

      <div className="profile-container">
        <div className="profile-card">
          <header className="profile-header-sub">
            <h1>Мій профіль</h1>
          </header>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {isEditing && (
            <div className="edit-mode-banner">
              Режим редагування: внесіть зміни та натисніть "Оновити дані
              профілю"
            </div>
          )}

          <div className="profile-info">
            <div className="user-badge">
              <div className="avatar">
                {currentUser.firstName?.[0]}
                {currentUser.lastName?.[0]}
              </div>
              <div>
                <h2>
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                <span
                  className="role-badge"
                  style={{ backgroundColor: ROLES[currentUser.role]?.color }}
                >
                  {ROLES[currentUser.role]?.label}
                </span>
                <span
                  className={`status-badge ${
                    currentUser.isActive ? "active" : "inactive"
                  }`}
                >
                  {currentUser.isActive ? "Активний" : "Неактивний"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Debug панель */}
            <div className="debug-panel">
              <div>
                РЕЖИМ:{" "}
                <strong>{isEditing ? "РЕДАГУВАННЯ" : "ПЕРЕГЛЯД"}</strong>
              </div>
              <div>
                Статус полів:{" "}
                <strong>
                  {isEditing ? "РОЗБЛОКОВАНО" : "ЗАБЛОКОВАНО"}
                </strong>
              </div>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Прізвище *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
                {errors.firstName && (
                  <span className="error">{errors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Ім'я *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
                {errors.lastName && (
                  <span className="error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group form-group-full">
                <label htmlFor="middleName">По батькові</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                {errors.phone && <span className="error">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group form-group-full">
                <label htmlFor="address">Адреса доставки</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthDate">Дата народження</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div className="password-section">
                <h4>Зміна пароля (необов'язково)</h4>
                <div className="form-group">
                  <label>Новий пароль</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Мінімум 6 символів"
                  />
                  {errors.password && (
                    <span className="error">{errors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Підтвердження пароля</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <span className="error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            )}

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
              {isEditing ? (
                <>
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "Збереження..." : "Оновити дані профілю"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Скасувати
                  </button>
                </>
              ) : (
                <button type="button" className="edit-btn" onClick={handleEdit}>
                  Редагувати профіль
                </button>
              )}
            </div>
          </form>

          <div className="profile-meta">
            <p>
              <strong>Дата реєстрації:</strong>{" "}
              {new Date(currentUser.createdAt).toLocaleDateString("uk-UA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
