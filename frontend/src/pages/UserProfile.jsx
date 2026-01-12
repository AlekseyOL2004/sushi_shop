import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import "./Profile.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const ROLES = {
  customer: { label: "Клієнт", color: "#1c879e" },
  manager: { label: "Менеджер", color: "#00c2a5" },
  moderator: { label: "Модератор", color: "#1c879e" },
  admin: { label: "Адміністратор", color: "#00c2a5" },
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
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
    if (user.role !== "admin") {
      navigate("/");
      return;
    }
    setCurrentAdmin(user);
    fetchUser();
  }, [userId, navigate]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`);
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();
      setTargetUser(user);

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
    } catch (error) {
      alert("Помилка завантаження користувача: " + error.message);
      navigate("/admin");
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("=== USER PROFILE FORM SUBMIT ===");
    console.log("isEditing:", isEditing);

    if (!isEditing) {
      console.log("❌ Not in editing mode");
      return;
    }

    if (!hasChanges()) {
      setErrors({
        general: "Дані не були змінені. Внесіть зміни перед збереженням.",
      });
      return;
    }

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

      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка оновлення");
      }

      const updatedUser = await res.json();
      setTargetUser(updatedUser);

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
      setSuccessMessage("Профіль користувача успішно оновлено!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
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
    console.log("=== ADMIN EDIT MODE ACTIVATED ===");
    setIsEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({ ...originalData, password: "", confirmPassword: "" });
    setIsEditing(false);
    setErrors({});
  };

  if (!targetUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="profile-page">
      <Header />

      <div className="profile-container">
        <div className="profile-card">
          <header className="profile-header-sub">
            <button onClick={() => navigate("/admin")} className="back-btn-sub">
              ← Назад до адмін-панелі
            </button>
            <h1>Профіль користувача</h1>
          </header>

          {successMessage && (
            <div className="success-message">✅ {successMessage}</div>
          )}

          {isEditing && (
            <div className="edit-mode-banner">
              📝 Режим редагування: внесіть зміни та натисніть "Оновити дані"
            </div>
          )}

          <div className="profile-info">
            <div className="user-badge">
              <div className="avatar">
                {targetUser.firstName?.[0]}
                {targetUser.lastName?.[0]}
              </div>
              <div>
                <h2>
                  {targetUser.firstName} {targetUser.lastName}
                </h2>
                <span
                  className="role-badge"
                  style={{ backgroundColor: ROLES[targetUser.role]?.color }}
                >
                  {ROLES[targetUser.role]?.label}
                </span>
                <span
                  className={`status-badge ${
                    targetUser.isActive ? "active" : "inactive"
                  }`}
                >
                  {targetUser.isActive ? "Активний" : "Неактивний"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Debug панель */}
            <div
              style={{
                background: isEditing ? "#d4edda" : "#f8d7da",
                color: isEditing ? "#155724" : "#721c24",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: `2px solid ${isEditing ? "#28a745" : "#dc3545"}`,
              }}
            >
              <div>
                🔍 РЕЖИМ:{" "}
                <strong>{isEditing ? "РЕДАГУВАННЯ" : "ПЕРЕГЛЯД"}</strong>
              </div>
              <div>
                Статус полів:{" "}
                <strong>
                  {isEditing ? "🔓 РОЗБЛОКОВАНО" : "🔒 ЗАБЛОКОВАНО"}
                </strong>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Прізвище *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    background: isEditing ? "white" : "#f7fafc",
                    border: isEditing
                      ? "2px solid #667eea"
                      : "2px solid #e2e8f0",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Ім'я *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    background: isEditing ? "white" : "#f7fafc",
                    border: isEditing
                      ? "2px solid #667eea"
                      : "2px solid #e2e8f0",
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>По батькові</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  background: isEditing ? "white" : "#f7fafc",
                  border: isEditing ? "2px solid #667eea" : "2px solid #e2e8f0",
                }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    background: isEditing ? "white" : "#f7fafc",
                    border: isEditing
                      ? "2px solid #667eea"
                      : "2px solid #e2e8f0",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  style={{
                    background: isEditing ? "white" : "#f7fafc",
                    border: isEditing
                      ? "2px solid #667eea"
                      : "2px solid #e2e8f0",
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Адреса</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  background: isEditing ? "white" : "#f7fafc",
                  border: isEditing ? "2px solid #667eea" : "2px solid #e2e8f0",
                }}
              />
            </div>

            <div className="form-group">
              <label>Дата народження</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  background: isEditing ? "white" : "#f7fafc",
                  border: isEditing ? "2px solid #667eea" : "2px solid #e2e8f0",
                }}
              />
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
                  />
                </div>

                <div className="form-group">
                  <label>Підтвердження пароля</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
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
                {errors.general.includes("не були змінені") ? "⚠️" : "❌"}{" "}
                {errors.general}
              </div>
            )}

            <div className="form-actions">
              {isEditing ? (
                <>
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "⏳ Збереження..." : "💾 Оновити дані"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    ❌ Скасувати
                  </button>
                </>
              ) : (
                <button type="button" className="edit-btn" onClick={handleEdit}>
                  ✏️ Редагувати профіль
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
