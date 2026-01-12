import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Checkout.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Checkout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    phone: "",
    address: "",
    sticksType: "learning",
    cutleryCount: 1,
    comment: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const loadUserData = () => {
    if (currentUser) {
      setFormData({
        lastName: currentUser.lastName || "",
        firstName: currentUser.firstName || "",
        middleName: currentUser.middleName || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        sticksType: formData.sticksType,
        cutleryCount: formData.cutleryCount,
        comment: formData.comment,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Введіть ім'я";
    if (!formData.lastName.trim()) newErrors.lastName = "Введіть прізвище";
    if (!formData.phone.trim()) newErrors.phone = "Введіть номер телефону";

    if (deliveryType === "delivery" && !formData.address.trim()) {
      newErrors.address = "Введіть адресу доставки";
    }

    if (formData.cutleryCount < 0) {
      newErrors.cutleryCount = "Кількість не може бути від'ємною";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTotalPrice = () => {
    const cartTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return deliveryType === "pickup" ? cartTotal * 0.95 : cartTotal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Кошик порожній!");
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        items: cart.map((item) => ({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: getTotalPrice(),
        customerName:
          `${formData.lastName} ${formData.firstName} ${formData.middleName}`.trim(),
        customerPhone: formData.phone,
        customerAddress:
          deliveryType === "delivery" ? formData.address : "Самовивіз",
        deliveryType,
        sticksType: formData.sticksType,
        cutleryCount: Number(formData.cutleryCount),
        comment: formData.comment,
        userId: currentUser?._id,
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Помилка оформлення замовлення");
      }

      const order = await res.json();

      localStorage.removeItem("cart");
      setCart([]);
      
      // Викликати кастомну подію для оновлення Header
      window.dispatchEvent(new Event('cartUpdated'));

      // Показати toast замість alert
      setOrderNumber(order._id.slice(-6).toUpperCase());
      setShowSuccessToast(true);

      // Перенаправити на головну через 4 секунди
      setTimeout(() => {
        navigate("/");
      }, 4000);
    } catch (error) {
      alert("❌ Помилка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter((item) => item._id !== itemId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    // Викликати кастомну подію для оновлення Header
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const newCart = cart.map((item) =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    // Викликати кастомну подію для оновлення Header
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Перевірити чи потрібні палички (якщо є не тільки напої та десерти)
  const needsCutlery = () => {
    if (cart.length === 0) return false;
    
    // Категорії, для яких НЕ потрібні палички
    const noCutleryCategories = ['drinks', 'desserts'];
    
    // Перевірити чи є хоч один товар, який НЕ є напоєм або десертом
    return cart.some(item => !noCutleryCategories.includes(item.category));
  };

  return (
    <div className="checkout-page">
      <Header cartCount={cartCount} />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast-overlay">
          <div className="success-toast-content">
            <div className="success-icon-wrapper">
              <img src="/icon/done.png" alt="Успіх" className="success-icon" />
            </div>
            <h2>Замовлення успішно оформлено!</h2>
            <p className="order-number">Номер замовлення: #{orderNumber}</p>
            <div className="success-details">
              <div className="detail-item-success">
                <img src="/icon/clock.png" alt="" />
                <span>Очікуваний час доставки: 30-40 хвилин</span>
              </div>
              <div className="detail-item-success">
                <img src="/icon/phone.png" alt="" />
                <span>Ми зв'яжемося з вами найближчим часом</span>
              </div>
            </div>
            <button 
              onClick={() => navigate("/")} 
              className="go-home-btn"
            >
              На головну
            </button>
          </div>
        </div>
      )}

      <div className="checkout-container">
        <h1>Оформлення замовлення</h1>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">
              <img src="/icon/basket.png" alt="Порожній кошик" />
            </div>
            <h2>Кошик порожній</h2>
            <p>Додайте товари з меню для оформлення замовлення</p>
            <button onClick={() => navigate("/menu")} className="go-menu-btn">
              <img src="/icon/menu.png" alt="" />
              Перейти до меню
            </button>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* Форма замовлення (ліва сторона) */}
            <div className="checkout-form-section">
              <h2 className="section-title">
                <img src="/icon/profile.png" alt="" className="section-icon" />
                Інформація для доставки
              </h2>

              <form onSubmit={handleSubmit} className="checkout-form">
                {/* ПІБ */}
                <div className="form-section">
                  <div className="section-header">
                    <h3>
                      <img src="/icon/profile.png" alt="" className="section-icon" />
                      Контактні дані
                    </h3>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={loadUserData}
                        className="load-user-btn"
                      >
                        Взяти з профілю
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Прізвище *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
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
                        required
                      />
                      {errors.firstName && (
                        <span className="error">{errors.firstName}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>По батькові</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Телефон */}
                <div className="form-section">
                  <h3>
                    <img src="/icon/phone.png" alt="" className="section-icon" />
                    Телефон
                  </h3>
                  <div className="form-group">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+380XXXXXXXXX"
                      required
                    />
                    {errors.phone && (
                      <span className="error">{errors.phone}</span>
                    )}
                  </div>
                </div>

                {/* Доставка */}
                <div className="form-section">
                  <h3>
                    <img src="/icon/delivery.png" alt="" className="section-icon" />
                    Доставка
                  </h3>

                  <div className="delivery-types">
                    <label
                      className={`delivery-option ${
                        deliveryType === "delivery" ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="delivery"
                        checked={deliveryType === "delivery"}
                        onChange={(e) => setDeliveryType(e.target.value)}
                      />
                      <div>
                        <strong>Доставка за Вашою адресою</strong>
                        <p>Безкоштовно від 500₴</p>
                      </div>
                    </label>

                    <label
                      className={`delivery-option ${
                        deliveryType === "pickup" ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="pickup"
                        checked={deliveryType === "pickup"}
                        onChange={(e) => setDeliveryType(e.target.value)}
                      />
                      <div>
                        <strong>Самовивіз (знижка -5%)</strong>
                        <p>вул. Хрещатик, 1, Київ</p>
                      </div>
                    </label>
                  </div>

                  {deliveryType === "delivery" && (
                    <div className="form-group">
                      <label>Адреса доставки *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Вулиця, будинок, квартира"
                        required
                      />
                      {errors.address && (
                        <span className="error">{errors.address}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Палички */}
                {needsCutlery() && (
                  <div className="form-group">
                    <label htmlFor="sticksType">
                      <img src="/icon/chopsticks.png" alt="" className="label-icon" />
                      Які палички Вам найбільше підходять?
                    </label>
                    <select
                      id="sticksType"
                      value={formData.sticksType}
                      onChange={(e) =>
                        setFormData({ ...formData, sticksType: e.target.value })
                      }
                      required
                    >
                      {[
                        { value: "learning", label: "Палички навчальні" },
                        { value: "regular", label: "Палички звичайні" },
                      ].map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Кількість приборів - показувати тільки якщо потрібні прибори */}
                {needsCutlery() && (
                  <div className="form-group">
                    <label htmlFor="cutleryCount">
                      <img src="/icon/chopsticks.png" alt="" className="label-icon" />
                      Кількість приборів
                    </label>
                    <input
                      type="number"
                      id="cutleryCount"
                      min="0"
                      max="20"
                      value={formData.cutleryCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cutleryCount: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Скільки комплектів приборів потрібно?"
                    />
                    <small style={{ color: "#718096", fontSize: "0.85rem", marginTop: "0.5rem", display: "block" }}>
                      За замовчуванням - 1 комплект на кожні 2 страви
                    </small>
                  </div>
                )}

                {/* Коментар */}
                <div className="form-group">
                  <label>Коментар до замовлення</label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Додаткові побажання..."
                  />
                </div>

                {/* Кнопка оформлення */}
                <button
                  type="submit"
                  className="submit-order-btn"
                  disabled={loading || cart.length === 0}
                >
                  {loading ? (
                    <>
                      <span>Обробка...</span>
                    </>
                  ) : (
                    <>
                      <img src="/icon/done.png" alt="" />
                      Оформити замовлення на {getTotalPrice().toFixed(2)}₴
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Товари в кошику (права сторона) */}
            {cart.length > 0 && (
              <div className="cart-items-section">
                <h2 className="section-title">
                  <img src="/icon/basket.png" alt="" className="section-icon" />
                  Товари в кошику
                </h2>
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item._id} className="cart-item">
                      <div className="item-image">{item.image}</div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p className="item-price">
                          {item.price}₴ × {item.quantity}
                        </p>
                      </div>
                      <div className="item-quantity">
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="remove-btn"
                      >
                        <img src="/icon/bin.png" alt="Видалити" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="cart-summary">
                  <div className="total-row">
                    <span>Всього товарів:</span>
                    <span>{cartCount} шт</span>
                  </div>
                  <div className="total-row">
                    <span>Сума:</span>
                    <span>
                      {cart
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )
                        .toFixed(2)}
                      ₴
                    </span>
                  </div>
                  {deliveryType === "pickup" && (
                    <div className="total-row discount">
                      <span>Знижка (самовивіз -5%):</span>
                      <span>
                        -
                        {(
                          cart.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          ) * 0.05
                        ).toFixed(2)}
                        ₴
                      </span>
                    </div>
                  )}
                  <div className="total-row final">
                    <span>До сплати:</span>
                    <span>{getTotalPrice().toFixed(2)}₴</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
