import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка входу");
      }

      const data = await res.json();

      // Зберегти дані користувача в localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user._id);

      // Перенаправити залежно від ролі
      if (data.user.role === "admin" || data.user.role === "moderator") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Header />

      <div className="login-container">
        <div className="login-card">
          <h1>Вхід</h1>
          <p className="subtitle">Введіть свої дані для входу в систему</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon"></span>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Вхід..." : "Увійти"}
            </button>

            <div className="links">
              <button
                type="button"
                onClick={() => navigate("/registration")}
                className="link-btn"
              >
                Немає акаунту? Зареєструватися
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="link-btn"
              >
                {/* Тест3 */}
                Повернутись на головну
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
