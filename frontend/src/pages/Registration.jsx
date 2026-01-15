import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Registration.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    phone: "",
    email: "",
    address: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.lastName.trim()) newErrors.lastName = "Введіть прізвище";
    if (!formData.firstName.trim()) newErrors.firstName = "Введіть ім'я";
    if (!formData.middleName.trim())
      newErrors.middleName = "Введіть по батькові";

    const phoneRegex = /^[\+]?[0-9]{10,13}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Введіть коректний номер телефону";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Введіть коректну електронну пошту";
    }

    if (!formData.address.trim()) newErrors.address = "Введіть адресу доставки";
    if (!formData.birthDate) newErrors.birthDate = "Введіть дату народження";

    if (formData.password.length < 6) {
      newErrors.password = "Пароль повинен містити мінімум 6 символів";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не збігаються";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            birthDate: formData.birthDate,
            password: formData.password,
            role: "customer",
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Помилка реєстрації");
        }

        // Показати toast успіху
        setShowSuccessToast(true);

        // Через 2 секунди перенаправити на сторінку входу
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        alert("Помилка: " + error.message);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Header />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast-registration">
          <div className="toast-content-registration">
            <div className="toast-icon-wrapper">
              <img
                src="/icon/done.png"
                alt="Успіх"
                className="toast-icon-success"
              />
            </div>
            <div className="toast-text">
              <h3>Реєстрація успішна!</h3>
              <p>Ви зареєстровані як клієнт</p>
              <p className="toast-hint">
                Зараз ви будете перенаправлені на сторінку входу...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="registration-container">
        <div className="registration-card">
          <h1>Реєстрація</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Прізвище *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && (
                <span className="error">{errors.lastName}</span>
              )}
            </div>

            <div className="form-group">
              <label>Ім'я *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && (
                <span className="error">{errors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label>По батькові *</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
              />
              {errors.middleName && (
                <span className="error">{errors.middleName}</span>
              )}
            </div>

            <div className="form-group">
              <label>Номер телефону *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+380XXXXXXXXX"
              />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label>Електронна пошта *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Адреса доставки *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && (
                <span className="error">{errors.address}</span>
              )}
            </div>

            <div className="form-group">
              <label>Дата народження *</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
              {errors.birthDate && (
                <span className="error">{errors.birthDate}</span>
              )}
            </div>

            <div className="form-group">
              <label>Пароль *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label>Підтвердження пароля *</label>
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

            <button type="submit" className="submit-btn">
              Зареєструватися
            </button>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate("/")}
            >
              Повернутись на головну
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
