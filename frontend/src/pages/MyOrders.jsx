import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./MyOrders.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3002";

const STATUS_CONFIG = {
  pending: {
    label: "Очікує підтвердження",
    color: "#fbbf24",
    description: "Ваше замовлення отримано і очікує підтвердження менеджером",
  },
  processing: {
    label: "В обробці",
    color: "#f97316",
    description: "Ваше замовлення прийнято і обробляється",
  },
  confirmed: {
    label: "Підтверджено",
    color: "#60a5fa",
    description: "Замовлення підтверджено менеджером",
  },
  preparing: {
    label: "Готується",
    color: "#f97316",
    description: "Ваше замовлення готується на кухні",
  },
  ready: {
    label: "Готово",
    color: "#a855f7",
    description: "Замовлення готове до самовивозу",
  },
  delivering: {
    label: "Доставляється",
    color: "#3b82f6",
    description: "Кур'єр везе ваше замовлення",
  },
  completed: {
    label: "Виконано",
    color: "#22c55e",
    description: "Замовлення доставлено. Смачного!",
  },
  cancelled: {
    label: "Скасовано",
    color: "#ef4444",
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
      "pending",
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
        <header className="page-header">
          <img src="/icon/box.png" alt="" className="page-icon" />
          <h1>Мої замовлення</h1>
        </header>

        {loading ? (
          <div className="loading">Завантаження...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders-placeholder">
            <div className="no-orders-icon-wrapper">
              <img
                src="/icon/basket.png"
                alt="Порожньо"
                className="no-orders-icon"
              />
            </div>
            <h2>У вас ще немає замовлень</h2>
            <p>Перейдіть до меню та зробіть своє перше замовлення!</p>
            <button onClick={() => navigate("/menu")} className="go-menu-btn">
              <img src="/icon/menu.png" alt="" />
              Перейти до меню
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card-my">
                <div className="order-card-header">
                  <div className="order-header-info">
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
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                <div className="order-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${getStatusProgress(order.status)}%`,
                        background: `linear-gradient(90deg, ${STATUS_CONFIG[order.status].color}, ${STATUS_CONFIG[order.status].color}dd)`,
                      }}
                    />
                  </div>
                  <p className="status-description">
                    {STATUS_CONFIG[order.status].description}
                  </p>
                </div>

                <div className="order-summary">
                  <div className="order-items-preview">
                    <div className="summary-header">
                      <img src="/icon/box.png" alt="" className="summary-icon" />
                      <strong>Товари:</strong>
                    </div>
                    <ul>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                      {order.items.length > 3 && (
                        <li className="more-items">
                          + ще {order.items.length - 3} товар(ів)
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="order-delivery-info">
                    <div className="summary-header">
                      <img
                        src="/icon/delivery.png"
                        alt=""
                        className="summary-icon"
                      />
                      <strong>
                        {order.deliveryType === "delivery"
                          ? "Доставка"
                          : "Самовивіз"}
                      </strong>
                    </div>
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
                  Переглянути деталі
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
            className="modal-content-details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Замовлення #{selectedOrder._id.slice(-6).toUpperCase()}</h2>
              <button onClick={closeModal} className="close-modal-btn-icon">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="order-timeline-section">
                <h3>
                  <img src="/icon/clock.png" alt="" className="section-icon" />
                  Статус замовлення
                </h3>
                <div className="order-timeline">
                  {[...selectedOrder.statusHistory]
                    .reverse()
                    .map((history, idx) => (
                      <div key={idx} className="timeline-item">
                        <div
                          className="timeline-marker"
                          style={{
                            backgroundColor: STATUS_CONFIG[history.status].color,
                          }}
                        >
                          {idx === 0 ? "●" : idx + 1}
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
              </div>

              <div className="order-details-section">
                <h3>
                  <img src="/icon/box.png" alt="" className="section-icon" />
                  Товари
                </h3>
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
                <h3>
                  <img src="/icon/delivery.png" alt="" className="section-icon" />
                  Інформація про доставку
                </h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Тип:</span>
                    <span className="detail-value">
                      {selectedOrder.deliveryType === "delivery"
                        ? "Доставка"
                        : "Самовивіз"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Адреса:</span>
                    <span className="detail-value">
                      {selectedOrder.customerAddress}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Телефон:</span>
                    <span className="detail-value">
                      {selectedOrder.customerPhone}
                    </span>
                  </div>
                  {selectedOrder.comment && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Коментар:</span>
                      <span className="detail-value">{selectedOrder.comment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-total-section">
                <div className="total-row">
                  <span>Сума товарів:</span>
                  <span>
                    {selectedOrder.items
                      .reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                      .toFixed(2)}
                    ₴
                  </span>
                </div>
                {selectedOrder.deliveryType === "pickup" && (
                  <div className="total-row discount">
                    <span>Знижка (самовивіз -5%):</span>
                    <span>
                      -
                      {(
                        selectedOrder.items
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          ) * 0.05
                      ).toFixed(2)}
                      ₴
                    </span>
                  </div>
                )}
                <div className="total-row final">
                  <span>Загальна сума:</span>
                  <span>{selectedOrder.totalPrice.toFixed(2)}₴</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="close-modal-btn">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
