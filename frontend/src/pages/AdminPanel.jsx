import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const ROLES = {
  customer: { label: "Клієнт", color: "#48bb78" },
  manager: { label: "Менеджер", color: "#4299e1" },
  moderator: { label: "Модератор", color: "#ed8936" },
  admin: { label: "Адміністратор", color: "#e53e3e" },
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    action: "",
    actionLabel: "",
    userId: null,
    userName: "",
    newRole: null,
    newStatus: null,
  });
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setHasAccess(false);
      setLoading(false);
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "moderator") {
      setHasAccess(false);
      setCurrentUser(user);
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    setAdminId(user._id);
    setHasAccess(true);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const openModal = (action, actionLabel, userId, userName, data = {}) => {
    setModalData({ action, actionLabel, userId, userName, ...data });
    setAdminPassword("");
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setAdminPassword("");
    setModalError("");
    setIsProcessing(false);
    setEditingUser(null);
  };

  const executeAction = async () => {
    if (!adminPassword) {
      setModalError("Введіть пароль адміна");
      return;
    }
    setIsProcessing(true);
    setModalError("");
    const { action, userId, newRole, newStatus } = modalData;
    try {
      if (action === "changeRole") {
        await handleRoleChange(userId, newRole);
        await fetchUsers();
        setSuccessMessage(`Роль змінено на ${ROLES[newRole].label}`);
      } else if (action === "toggleStatus") {
        await handleStatusToggle(userId, newStatus);
        await fetchUsers();
        setSuccessMessage(
          `Користувача ${newStatus ? "активовано" : "деактивовано"}`
        );
      } else if (action === "deleteUser") {
        await handleDeleteUser(userId);
        await fetchUsers();
        setSuccessMessage("Користувача видалено");
      }
      setEditingUser(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      closeModal();
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const res = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole, adminId, adminPassword }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Помилка зміни ролі");
    }
  };

  const handleStatusToggle = async (userId, newStatus) => {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus, adminId, adminPassword }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Помилка зміни статусу");
    }
  };

  const handleDeleteUser = async (userId) => {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, adminPassword }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Помилка видалення");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!hasAccess) {
    return (
      <div className="admin-panel">
        <header className="admin-header">
          <button onClick={() => navigate("/")} className="back-btn">
            ← Назад
          </button>
          <h1>Адміністративна панель</h1>
        </header>
        <div className="no-access-container">
          <div className="no-access-card">
            <div className="no-access-icon">🔒</div>
            <h2>Доступ заборонено</h2>
            <p>Тільки адміністратори мають доступ</p>
            <button
              onClick={() => navigate(currentUser ? "/" : "/login")}
              className="btn-primary"
            >
              {currentUser ? "На головну" : "Увійти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <button onClick={() => navigate("/")} className="back-btn">
          ← Назад
        </button>
        <h1>Адміністративна панель</h1>
        <div className="admin-info">
          <span className="admin-badge">✅ {currentUser?.firstName}</span>
          <button onClick={handleLogout} className="logout-btn">
            Вийти
          </button>
        </div>
      </header>
      {showSuccessMessage && (
        <div className="success-toast">✅ {successMessage}</div>
      )}
      <div className="admin-container">
        <div className="filters-section">
          <input
            type="text"
            placeholder="🔍 Пошук..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-box"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">Всі ролі</option>
            {Object.keys(ROLES).map((role) => (
              <option key={role} value={role}>
                {ROLES[role].label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="loading">Завантаження...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Ім'я</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: ROLES[user.role]?.color }}
                    >
                      {ROLES[user.role]?.label}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.isActive ? "active" : "inactive"
                      }`}
                    >
                      {user.isActive ? "Активний" : "Неактивний"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {editingUser === user._id ? (
                        <select
                          defaultValue={user.role}
                          onChange={(e) =>
                            openModal(
                              "changeRole",
                              `Змінити роль на "${
                                ROLES[e.target.value].label
                              }"`,
                              user._id,
                              user.firstName,
                              { newRole: e.target.value }
                            )
                          }
                          className="role-select"
                        >
                          {Object.keys(ROLES).map((role) => (
                            <option key={role} value={role}>
                              {ROLES[role].label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingUser(user._id)}
                          className="btn-edit"
                        >
                          Змінити роль
                        </button>
                      )}
                      <button
                        onClick={() =>
                          openModal(
                            "toggleStatus",
                            user.isActive ? "Деактивувати" : "Активувати",
                            user._id,
                            user.firstName,
                            { newStatus: !user.isActive }
                          )
                        }
                        className="btn-status"
                      >
                        {user.isActive ? "Деактивувати" : "Активувати"}
                      </button>
                      <button
                        onClick={() => navigate(`/profile/${user._id}`)}
                        className="btn-view"
                      >
                        👁️ Переглянути
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Підтвердження</h3>
            <p>{modalData.actionLabel}</p>
            <input
              type="password"
              placeholder="Пароль адміна"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="password-input"
            />
            {modalError && <div className="error-message">{modalError}</div>}
            <div className="modal-buttons">
              <button onClick={executeAction} disabled={isProcessing}>
                {isProcessing ? "..." : "Підтвердити"}
              </button>
              <button onClick={closeModal}>Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
