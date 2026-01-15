import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Header from "../components/Header";
import "./MyOrders.css"; // Використаємо існуючі стилі

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

export default function TrackOrder() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrOrderId, setQROrderId] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError("Введіть номер телефону");
      return;
    }

    console.log("Searching for phone:", phone);

    setLoading(true);
    setError("");
    
    try {
      console.log("Making request to:", `${API_BASE}/orders/track`);
      
      const res = await fetch(`${API_BASE}/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error("Помилка пошуку замовлень");
      }
      
      const data = await res.json();
      console.log("Found orders:", data);
      
      setOrders(data);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setError("Помилка: " + err.message);
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

  const openQRModal = (orderId) => {
    const shortId = orderId.slice(-6).toUpperCase();
    setQROrderId(shortId);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQROrderId("");
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

  return (
    <div className="my-orders-page">
      <Header />

      <div className="my-orders-container">
        <header className="page-header">
          <img src="/icon/box.png" alt="" className="page-icon" />
          <h1>Відстеження замовлення</h1>
        </header>

        <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
          <form onSubmit={handleSearch} style={{ marginBottom: "2rem" }}>
            <div className="form-group">
              <label htmlFor="phone" style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>
                Введіть номер телефону, який вказували при замовленні:
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380XXXXXXXXX"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "1rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "1rem"
                }}
              />
              {error && <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>{error}</span>}
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.9rem",
                background: "linear-gradient(135deg, #1c879e 0%, #00c2a5 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Пошук..." : "Знайти замовлення"}
            </button>
          </form>
        </div>

        {searched && orders.length === 0 && (
          <div className="no-orders-placeholder">
            <div className="no-orders-icon-wrapper">
              <img
                src="/icon/basket.png"
                alt="Не знайдено"
                className="no-orders-icon"
              />
            </div>
            <h2>Замовлення не знайдено</h2>
            <p>Перевірте правильність номера телефону</p>
          </div>
        )}

        {orders.length > 0 && (
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

                <div className="order-actions-wrapper">
                  <button
                    onClick={() => openOrderDetails(order)}
                    className="view-order-btn"
                  >
                    Переглянути деталі
                  </button>
                  <button
                    onClick={() => openQRModal(order._id)}
                    className="qr-code-btn"
                    title="Показати QR код"
                  >
                    <img src="/icon/qr-icon.jpg" alt="QR" className="qr-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка деталей замовлення */}
      {showModal && selectedOrder && (
        <div className="my-modal-overlay" onClick={closeModal}>
          <div
            className="my-modal-content-details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="my-modal-header">
              <h2>Замовлення #{selectedOrder._id.slice(-6).toUpperCase()}</h2>
              <button onClick={closeModal} className="my-close-modal-btn-icon">
                ✕
              </button>
            </div>

            <div className="my-modal-body">
              <div className="my-order-timeline-section">
                <h3>
                  <img src="/icon/clock.png" alt="" className="my-section-icon" />
                  Статус замовлення
                </h3>
                <div className="my-order-timeline">
                  {[...selectedOrder.statusHistory]
                    .reverse()
                    .map((history, idx) => (
                      <div key={idx} className="my-timeline-item">
                        <div
                          className="my-timeline-marker"
                          style={{
                            backgroundColor: STATUS_CONFIG[history.status].color,
                          }}
                        >
                          {idx === 0 ? "●" : idx + 1}
                        </div>
                        <div className="my-timeline-content">
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

              <div className="my-order-details-section">
                <h3>
                  <img src="/icon/box.png" alt="" className="my-section-icon" />
                  Товари
                </h3>
                <div className="my-order-items-list">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="my-order-item-row">
                      <span className="my-item-name">{item.name}</span>
                      <span className="my-item-quantity">× {item.quantity}</span>
                      <span className="my-item-price">
                        {(item.price * item.quantity).toFixed(2)}₴
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="my-order-details-section">
                <h3>
                  <img src="/icon/delivery.png" alt="" className="my-section-icon" />
                  Інформація про доставку
                </h3>
                <div className="my-details-grid">
                  <div className="my-detail-item">
                    <span className="my-detail-label">Тип:</span>
                    <span className="my-detail-value">
                      {selectedOrder.deliveryType === "delivery"
                        ? "Доставка"
                        : "Самовивіз"}
                    </span>
                  </div>
                  <div className="my-detail-item">
                    <span className="my-detail-label">Адреса:</span>
                    <span className="my-detail-value">
                      {selectedOrder.customerAddress}
                    </span>
                  </div>
                  <div className="my-detail-item">
                    <span className="my-detail-label">Телефон:</span>
                    <span className="my-detail-value">
                      {selectedOrder.customerPhone}
                    </span>
                  </div>
                  {selectedOrder.comment && (
                    <div className="my-detail-item full-width">
                      <span className="my-detail-label">Коментар:</span>
                      <span className="my-detail-value">{selectedOrder.comment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="my-order-total-section">
                <div className="my-total-row">
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
                  <div className="my-total-row discount">
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
                <div className="my-total-row final">
                  <span>Загальна сума:</span>
                  <span>{selectedOrder.totalPrice.toFixed(2)}₴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка QR коду */}
      {showQRModal && (
        <div className="modal-overlay" onClick={closeQRModal}>
          <div
            className="modal-content-qr"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>QR Код замовлення</h2>
              <button onClick={closeQRModal} className="close-modal-btn-icon">
                ✕
              </button>
            </div>

            <div className="modal-body-qr">
              <div className="qr-code-container">
                <QRCodeSVG
                  value={qrOrderId}
                  size={256}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1c879e"
                />
              </div>
              <div className="qr-order-id">
                <strong>ID замовлення:</strong>
                <span>#{qrOrderId}</span>
              </div>
              <p className="qr-hint">
                Покажіть цей QR код для підтвердження замовлення
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
