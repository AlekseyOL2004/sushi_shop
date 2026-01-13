import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./OrdersManagement.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3002";

const STATUS_CONFIG = {
  pending: { label: "Очікує підтвердження", color: "#fbbf24", icon: "/icon/clock.png" },
  processing: { label: "В обробці", color: "#f97316", icon: "/icon/clock.png" },
  confirmed: { label: "Прийнято", color: "#60a5fa", icon: "/icon/done.png" },
  preparing: { label: "Готується", color: "#f97316", icon: "/icon/chef.png" },
  ready: { label: "Готово", color: "#a855f7", icon: "/icon/ready.png" },
  delivering: { label: "Доставляється", color: "#3b82f6", icon: "/icon/delivery.png" },
  completed: { label: "Виконано", color: "#22c55e", icon: "/icon/done.png" },
  cancelled: { label: "Скасовано", color: "#ef4444", icon: "/icon/cancel.png" },
};

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

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

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleStatusChange = async () => {
    if (!newStatus || !selectedOrder) return;

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

      showSuccessToast(`Статус замовлення змінено на "${STATUS_CONFIG[newStatus].label}"`);
      await fetchOrders();
      closeModal();
    } catch (error) {
      showSuccessToast(`Помилка: ${error.message}`);
    }
  };

  const getNextStatuses = (currentStatus, deliveryType) => {
    const allStatuses = ["pending", "processing", "confirmed", "preparing"];

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

  const openDetailsModal = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const data = await res.json();
      setDetailsOrder(data);
      setShowDetailsModal(true);
    } catch (error) {
      showSuccessToast(`Помилка: ${error.message}`);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsOrder(null);
  };

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="orders-management">
      <Header />

      <div className="orders-content">
        <header className="orders-header">
          <h1>
            <img src="/icon/box2.png" alt="Замовлення" className="header-icon" />
            Управління замовленнями
          </h1>
          <button onClick={fetchOrders} className="refresh-btn">
            {/* <img src="/icon/refresh.png" alt="Оновити" /> */}
            Оновити
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
                {config.label} ({orders.filter((o) => o.status === key).length})
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
                    {/* <img src={STATUS_CONFIG[order.status].icon} alt="" className="status-icon" /> */}
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                <div className="order-body">
                  <div className="order-info">
                    <p>
                      <img src="/icon/profile.png" alt="" className="info-icon" />
                      <strong>Клієнт:</strong> {order.customerName}
                    </p>
                    <p>
                      <img src="/icon/phone.png" alt="" className="info-icon" />
                      <strong>Телефон:</strong> {order.customerPhone}
                    </p>
                    <p>
                      <img src={order.deliveryType === "delivery" ? "/icon/delivery.png" : "/icon/delivery.png"} alt="" className="info-icon" />
                      <strong>
                        {order.deliveryType === "delivery" ? "Адреса" : "Самовивіз"}:
                      </strong>{" "}
                      {order.customerAddress}
                    </p>
                    {order.comment && (
                      <p>
                        <img src="/icon/reviews.png" alt="" className="info-icon" />
                        <strong>Коментар:</strong> {order.comment}
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
                        {/* <img src="/icon/discount.png" alt="" /> */}
                        Знижка -5% застосована
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                    <button
                      onClick={() => openStatusModal(order)}
                      className="change-status-btn"
                    >
                      Змінити статус
                    </button>
                    <button
                      onClick={() => openDetailsModal(order._id)}
                      className="view-details-btn"
                    >
                      Деталі
                    </button>
                  </div>

                  {order.managerId && (
                    <p className="manager-info">
                      <img src="/icon/admin-panel.png" alt="" className="info-icon" />
                      Менеджер: {order.managerId.firstName}{" "}
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
                    {/* <img src={STATUS_CONFIG[status].icon} alt="" className="status-option-icon" /> */}
                    {STATUS_CONFIG[status].label}
                  </span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={handleStatusChange} className="confirm-btn">
                <img src="/icon/done.png" alt="" />
                Підтвердити
              </button>
              <button onClick={closeModal} className="cancel-btn">
                {/* <img src="/icon/cancel.png" alt="" /> */}
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка деталей замовлення */}
      {showDetailsModal && detailsOrder && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Деталі замовлення #{detailsOrder._id.slice(-6).toUpperCase()}</h2>
              <button onClick={closeDetailsModal} className="close-modal-btn-icon">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Історія статусів */}
              <div className="details-section">
                <h3>
                  <img src="/icon/clock.png" alt="" className="section-icon" />
                  Історія статусів
                </h3>
                <div className="status-timeline">
                  {detailsOrder.statusHistory && detailsOrder.statusHistory.length > 0 ? (
                    [...detailsOrder.statusHistory].reverse().map((history, idx) => (
                      <div key={idx} className="timeline-item">
                        <div
                          className="timeline-marker"
                          style={{
                            backgroundColor: STATUS_CONFIG[history.status]?.color || "#718096",
                          }}
                        >
                          {idx === 0 ? "●" : idx + 1}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-status-name">
                            {STATUS_CONFIG[history.status]?.label || history.status}
                          </div>
                          <div className="timeline-time">
                            {new Date(history.timestamp).toLocaleString("uk-UA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {history.updatedBy && (
                            <div className="timeline-user">
                              Оновлено менеджером
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-history">Історія статусів недоступна</p>
                  )}
                </div>
              </div>

              {/* Інформація про клієнта */}
              <div className="details-section">
                <h3>
                  <img src="/icon/profile.png" alt="" className="section-icon" />
                  Інформація про клієнта
                </h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Ім'я:</span>
                    <span className="detail-value">{detailsOrder.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Телефон:</span>
                    <span className="detail-value">{detailsOrder.customerPhone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Тип доставки:</span>
                    <span className="detail-value">
                      {detailsOrder.deliveryType === "delivery" ? "Доставка" : "Самовивіз"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Адреса:</span>
                    <span className="detail-value">{detailsOrder.customerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Товари */}
              <div className="details-section">
                <h3>
                  <img src="/icon/box.png" alt="" className="section-icon" />
                  Товари в замовленні
                </h3>
                <div className="details-items-list">
                  {detailsOrder.items.map((item, idx) => (
                    <div key={idx} className="details-item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                      <span className="item-price">{item.price}₴</span>
                      <span className="item-total">{(item.price * item.quantity).toFixed(2)}₴</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Додаткова інформація */}
              {(detailsOrder.comment || detailsOrder.sticksType) && (
                <div className="details-section">
                  <h3>
                    <img src="/icon/reviews.png" alt="" className="section-icon" />
                    Додаткова інформація
                  </h3>
                  <div className="details-grid">
                    {detailsOrder.sticksType && (
                      <div className="detail-item">
                        <span className="detail-label">Палички:</span>
                        <span className="detail-value">
                          {detailsOrder.sticksType === "learning" ? "Навчальні" : "Звичайні"}
                        </span>
                      </div>
                    )}
                    {detailsOrder.cutleryCount > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Кількість приборів:</span>
                        <span className="detail-value">{detailsOrder.cutleryCount}</span>
                      </div>
                    )}
                    {detailsOrder.comment && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Коментар:</span>
                        <span className="detail-value">{detailsOrder.comment}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Підсумок */}
              <div className="details-total">
                <div className="total-row">
                  <span>Сума товарів:</span>
                  <span>
                    {detailsOrder.items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ).toFixed(2)}₴
                  </span>
                </div>
                {detailsOrder.deliveryType === "pickup" && (
                  <div className="total-row discount">
                    <span>Знижка (самовивіз -5%):</span>
                    <span>
                      -
                      {(
                        detailsOrder.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) * 0.05
                      ).toFixed(2)}₴
                    </span>
                  </div>
                )}
                <div className="total-row final">
                  <span>Загальна сума:</span>
                  <span>{detailsOrder.totalPrice.toFixed(2)}₴</span>
                </div>
              </div>

              {detailsOrder.managerId && (
                <div className="manager-badge">
                  <img src="/icon/admin-panel.png" alt="" />
                  Менеджер: {detailsOrder.managerId.firstName} {detailsOrder.managerId.lastName}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={closeDetailsModal} className="close-details-btn">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showToast && (
        <div className="success-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
