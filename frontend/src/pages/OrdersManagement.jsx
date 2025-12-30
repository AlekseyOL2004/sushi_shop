import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./OrdersManagement.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const STATUS_CONFIG = {
  processing: { label: "В обробці", color: "#fbbf24", icon: "⏳" },
  confirmed: { label: "Прийнято", color: "#60a5fa", icon: "✅" },
  preparing: { label: "Готується", color: "#f97316", icon: "👨‍🍳" },
  ready: { label: "Готово", color: "#a855f7", icon: "✨" },
  delivering: { label: "Доставляється", color: "#3b82f6", icon: "🚚" },
  completed: { label: "Виконано", color: "#22c55e", icon: "🎉" },
  cancelled: { label: "Скасовано", color: "#ef4444", icon: "❌" },
};

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userData);
    if (!["manager", "moderator", "admin"].includes(user.role)) {
      navigate("/");
      return;
    }
    setCurrentUser(user);
    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    // Оновлювати замовлення кожні 30 секунд
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setNewStatus("");
  };

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const res = await fetch(
        `${API_BASE}/orders/${selectedOrder._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            managerId: currentUser._id,
            managerRole: currentUser.role,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      await fetchOrders();
      closeModal();
      alert("✅ Статус змінено успішно!");
    } catch (error) {
      alert("❌ Помилка: " + error.message);
    }
  };

  const getNextStatuses = (currentStatus, deliveryType) => {
    const allStatuses = ["processing", "confirmed", "preparing"];

    if (deliveryType === "pickup") {
      allStatuses.push("ready", "completed");
    } else {
      allStatuses.push("delivering", "completed");
    }

    allStatuses.push("cancelled");
    return allStatuses;
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") {
      return !["completed", "cancelled"].includes(order.status);
    }
    return order.status === filterStatus;
  });

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="orders-management">
      <Header />

      <div className="orders-content">
        <header className="orders-header">
          <h1>📦 Управління замовленнями</h1>
          <button onClick={fetchOrders} className="refresh-btn">
            🔄 Оновити
          </button>
        </header>

        <div className="orders-filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">Всі замовлення ({orders.length})</option>
            <option value="active">
              Активні (
              {
                orders.filter(
                  (o) => !["completed", "cancelled"].includes(o.status)
                ).length
              }
              )
            </option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label} (
                {orders.filter((o) => o.status === key).length})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Завантаження...</div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Замовлення #{order._id.slice(-6).toUpperCase()}</h3>
                    <p className="order-time">
                      {new Date(order.createdAt).toLocaleString("uk-UA")}
                    </p>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: STATUS_CONFIG[order.status].color,
                    }}
                  >
                    {STATUS_CONFIG[order.status].icon}{" "}
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                <div className="order-body">
                  <div className="order-info">
                    <p>
                      <strong>👤 Клієнт:</strong> {order.customerName}
                    </p>
                    <p>
                      <strong>📞 Телефон:</strong> {order.customerPhone}
                    </p>
                    <p>
                      <strong>
                        {order.deliveryType === "delivery"
                          ? "🏠 Адреса"
                          : "🏪 Самовивіз"}
                        :
                      </strong>{" "}
                      {order.customerAddress}
                    </p>
                    {order.comment && (
                      <p>
                        <strong>💬 Коментар:</strong> {order.comment}
                      </p>
                    )}
                  </div>

                  <div className="order-items">
                    <h4>Товари:</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>{(item.price * item.quantity).toFixed(2)}₴</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Всього:</strong>
                      <strong className="total-price">
                        {order.totalPrice.toFixed(2)}₴
                      </strong>
                    </div>
                    {order.deliveryType === "pickup" && (
                      <div className="discount-info">
                        💰 Знижка -5% застосована
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                    <button
                      onClick={() => openStatusModal(order)}
                      className="change-status-btn"
                    >
                      🔄 Змінити статус
                    </button>
                    <button
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="view-details-btn"
                    >
                      👁️ Деталі
                    </button>
                  </div>

                  {order.managerId && (
                    <p className="manager-info">
                      👨‍💼 Менеджер: {order.managerId.firstName}{" "}
                      {order.managerId.lastName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="no-orders">
            <h3>Немає замовлень</h3>
            <p>Замовлення з'являться тут автоматично</p>
          </div>
        )}
      </div>

      {/* Модалка зміни статусу */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Зміна статусу замовлення</h3>
            <p className="modal-order-id">
              Замовлення #{selectedOrder._id.slice(-6).toUpperCase()}
            </p>

            <div className="status-selection">
              {getNextStatuses(
                selectedOrder.status,
                selectedOrder.deliveryType
              ).map((status) => (
                <label
                  key={status}
                  className={`status-option ${
                    newStatus === status ? "selected" : ""
                  }`}
                  style={{
                    borderColor:
                      newStatus === status
                        ? STATUS_CONFIG[status].color
                        : "#e2e8f0",
                    backgroundColor:
                      newStatus === status
                        ? `${STATUS_CONFIG[status].color}20`
                        : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={newStatus === status}
                    onChange={(e) => setNewStatus(e.target.value)}
                  />
                  <span>
                    {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
                  </span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={handleStatusChange} className="confirm-btn">
                ✅ Підтвердити
              </button>
              <button onClick={closeModal} className="cancel-btn">
                ❌ Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
