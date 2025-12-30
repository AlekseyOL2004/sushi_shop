import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./MyOrders.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const STATUS_CONFIG = {
  processing: {
    label: "В обробці",
    color: "#fbbf24",
    icon: "⏳",
    description: "Ваше замовлення прийнято і очікує обробки",
  },
  confirmed: {
    label: "Прийнято",
    color: "#60a5fa",
    icon: "✅",
    description: "Замовлення підтверджено менеджером",
  },
  preparing: {
    label: "Готується",
    color: "#f97316",
    icon: "👨‍🍳",
    description: "Ваше замовлення готується на кухні",
  },
  ready: {
    label: "Готово",
    color: "#a855f7",
    icon: "✨",
    description: "Замовлення готове до самовивозу",
  },
  delivering: {
    label: "Доставляється",
    color: "#3b82f6",
    icon: "🚚",
    description: "Кур'єр везе ваше замовлення",
  },
  completed: {
    label: "Виконано",
    color: "#22c55e",
    icon: "🎉",
    description: "Замовлення доставлено. Смачного!",
  },
  cancelled: {
    label: "Скасовано",
    color: "#ef4444",
    icon: "❌",
    description: "Замовлення скасовано",
  },
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userData);
    setCurrentUser(user);
    fetchOrders(user._id);
  }, [navigate]);

  useEffect(() => {
    // Оновлювати кожні 15 секунд
    if (currentUser) {
      const interval = setInterval(() => fetchOrders(currentUser._id), 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/orders/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const getStatusProgress = (status) => {
    const statuses = [
      "processing",
      "confirmed",
      "preparing",
      "ready",
      "delivering",
      "completed",
    ];
    const currentIndex = statuses.indexOf(status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  if (!currentUser) return <div className="loading">Завантаження...</div>;

  return (
    <div className="my-orders-page">
      <Header />

      <div className="my-orders-container">
        <h1>📦 Мої замовлення</h1>

        {loading ? (
          <div className="loading">Завантаження...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders-placeholder">
            <div className="no-orders-icon">🛒</div>
            <h2>У вас ще немає замовлень</h2>
            <p>Перейдіть до меню та зробіть своє перше замовлення!</p>
            <button onClick={() => navigate("/menu")} className="go-menu-btn">
              📋 Перейти до меню
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card-my">
                <div className="order-card-header">
                  <div>
                    <h3>Замовлення #{order._id.slice(-6).toUpperCase()}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleString("uk-UA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className="status-badge-large"
                    style={{
                      backgroundColor: STATUS_CONFIG[order.status].color,
                    }}
                  >
                    {STATUS_CONFIG[order.status].icon}{" "}
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                <div className="order-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${getStatusProgress(order.status)}%`,
                        backgroundColor: STATUS_CONFIG[order.status].color,
                      }}
                    />
                  </div>
                  <p className="status-description">
                    {STATUS_CONFIG[order.status].description}
                  </p>
                </div>

                <div className="order-summary">
                  <div className="order-items-preview">
                    <strong>Товари:</strong>
                    <ul>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                      {order.items.length > 3 && (
                        <li>... і ще {order.items.length - 3} товар(ів)</li>
                      )}
                    </ul>
                  </div>

                  <div className="order-delivery-info">
                    <p>
                      <strong>
                        {order.deliveryType === "delivery"
                          ? "🏠 Доставка"
                          : "🏪 Самовивіз"}
                      </strong>
                    </p>
                    <p className="delivery-address">{order.customerAddress}</p>
                  </div>

                  <div className="order-total-price">
                    <strong>Сума:</strong>
                    <span className="price">
                      {order.totalPrice.toFixed(2)}₴
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openOrderDetails(order)}
                  className="view-order-btn"
                >
                  👁️ Переглянути деталі
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка деталей замовлення */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content-large"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Замовлення #{selectedOrder._id.slice(-6).toUpperCase()}</h2>

            <div className="order-timeline">
              <h3>📊 Статус замовлення</h3>
              {selectedOrder.statusHistory.map((history, idx) => (
                <div key={idx} className="timeline-item">
                  <div
                    className="timeline-marker"
                    style={{
                      backgroundColor: STATUS_CONFIG[history.status].color,
                    }}
                  >
                    {STATUS_CONFIG[history.status].icon}
                  </div>
                  <div className="timeline-content">
                    <strong>{STATUS_CONFIG[history.status].label}</strong>
                    <p>
                      {new Date(history.timestamp).toLocaleString("uk-UA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-details-section">
              <h3>🛍️ Товари</h3>
              <div className="order-items-list">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">× {item.quantity}</span>
                    <span className="item-price">
                      {(item.price * item.quantity).toFixed(2)}₴
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-details-section">
              <h3>📋 Інформація про доставку</h3>
              <p>
                <strong>Тип:</strong>{" "}
                {selectedOrder.deliveryType === "delivery"
                  ? "Доставка"
                  : "Самовивіз"}
              </p>
              <p>
                <strong>Адреса:</strong> {selectedOrder.customerAddress}
              </p>
              <p>
                <strong>Телефон:</strong> {selectedOrder.customerPhone}
              </p>
              {selectedOrder.comment && (
                <p>
                  <strong>Коментар:</strong> {selectedOrder.comment}
                </p>
              )}
            </div>

            <div className="order-total-section">
              <h3>Всього до сплати:</h3>
              <h2 className="total-amount">
                {selectedOrder.totalPrice.toFixed(2)}₴
              </h2>
            </div>

            <button onClick={closeModal} className="close-modal-btn">
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
