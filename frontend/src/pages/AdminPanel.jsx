import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./AdminPanel.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const buttonRefs = useRef({});

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
    setCurrentUser(user);
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openRoleDropdown &&
        !event.target.closest(".role-select") &&
        !event.target.closest(".role-dropdown-portal")
      ) {
        setOpenRoleDropdown(null);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setOpenRoleDropdown(null);
        setShowPasswordModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [openRoleDropdown]);

  const fetchUsers = async () => {
    try {
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

  const handleOpenDropdown = (userId, event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    setDropdownPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
    });

    setOpenRoleDropdown(openRoleDropdown === userId ? null : userId);
  };

  const handleRoleChangeRequest = (userId, newRole) => {
    setOpenRoleDropdown(null);
    setModalAction({ type: "changeRole", userId, newRole });
    setShowPasswordModal(true);
    setAdminPassword("");
    setPasswordError("");
  };

  const handleToggleStatusRequest = (userId, currentStatus) => {
    setModalAction({ type: "toggleStatus", userId, currentStatus });
    setShowPasswordModal(true);
    setAdminPassword("");
    setPasswordError("");
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConfirmAction = async () => {
    if (!adminPassword) {
      setPasswordError("Введіть пароль адміністратора");
      return;
    }

    try {
      if (modalAction.type === "changeRole") {
        const res = await fetch(
          `${API_BASE}/users/${modalAction.userId}/role`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: modalAction.newRole,
              adminId: currentUser._id,
              adminPassword: adminPassword,
            }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message);
        }

        showSuccessToast("Роль успішно змінено!");
      } else if (modalAction.type === "toggleStatus") {
        const res = await fetch(
          `${API_BASE}/users/${modalAction.userId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminId: currentUser._id,
              adminPassword: adminPassword,
            }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message);
        }

        showSuccessToast("Статус успішно змінено!");
      }

      await fetchUsers();
      setShowPasswordModal(false);
      setModalAction(null);
      setAdminPassword("");
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="admin-panel">
      <Header />

      <div className="admin-container">
        <div className="admin-header">
          <h1>Адмін панель</h1>
          <p>Управління користувачами системи</p>
        </div>

        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Пошук користувачів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="all">Всі ролі</option>
              <option value="customer">Клієнти</option>
              <option value="manager">Менеджери</option>
              <option value="moderator">Модератори</option>
              <option value="admin">Адміністратори</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <h3>Користувачів не знайдено</h3>
            <p>Спробуйте змінити параметри пошуку</p>
          </div>
        ) : (
          <div className="users-table-container">
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
                    <td className="user-name">
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === "admin"
                          ? "Адміністратор"
                          : user.role === "moderator"
                          ? "Модератор"
                          : user.role === "manager"
                          ? "Менеджер"
                          : "Клієнт"}
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
                        <button
                          ref={(el) => (buttonRefs.current[user._id] = el)}
                          className="btn-edit role-select"
                          onClick={(e) => handleOpenDropdown(user._id, e)}
                        >
                          Змінити роль
                        </button>
                        <button
                          className={`btn-status ${
                            user.isActive ? "btn-deactivate" : "btn-activate"
                          }`}
                          onClick={() =>
                            handleToggleStatusRequest(user._id, user.isActive)
                          }
                        >
                          {user.isActive ? "Деактивувати" : "Активувати"}
                        </button>
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/admin/users/${user._id}`)}
                        >
                          Переглянути
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dropdown portal */}
      {openRoleDropdown && (
        <div
          className="role-dropdown-portal"
          style={{
            position: "absolute",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 10000,
          }}
        >
          <div className="role-dropdown">
            <button
              onClick={() =>
                handleRoleChangeRequest(openRoleDropdown, "customer")
              }
            >
              Клієнт
            </button>
            <button
              onClick={() =>
                handleRoleChangeRequest(openRoleDropdown, "manager")
              }
            >
              Менеджер
            </button>
            <button
              onClick={() =>
                handleRoleChangeRequest(openRoleDropdown, "moderator")
              }
            >
              Модератор
            </button>
            <button
              onClick={() => handleRoleChangeRequest(openRoleDropdown, "admin")}
            >
              Адміністратор
            </button>
          </div>
        </div>
      )}

      {/* Password confirmation modal */}
      {showPasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Підтвердження дії</h3>
            <p>
              {modalAction?.type === "changeRole"
                ? "Для зміни ролі введіть пароль адміністратора"
                : "Для зміни статусу введіть пароль адміністратора"}
            </p>

            <input
              type="password"
              placeholder="Пароль адміністратора"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setPasswordError("");
              }}
              className="password-input"
              autoFocus
            />

            {passwordError && (
              <div className="error-message">{passwordError}</div>
            )}

            <div className="modal-buttons">
              <button onClick={handleConfirmAction} disabled={!adminPassword}>
                Підтвердити
              </button>
              <button onClick={() => setShowPasswordModal(false)}>
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showToast && <div className="success-toast">{toastMessage}</div>}
    </div>
  );
}
