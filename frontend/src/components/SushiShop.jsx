import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3002";

export default function SushiShop() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Завантажити меню та відгуки при монтуванні компонента
  useEffect(() => {
    // Завантажити кошик з localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE}/menu?available=true`),
          fetch(`${API_BASE}/reviews?limit=3&approved=true`),
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData);
        }
        if (reviewsRes.ok) setReviews(await reviewsRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.id === item.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      // Зберігаємо всі поля включно з imageUrl
      newCart = [...cart, { 
        ...item, 
        quantity: 1 
      }];
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    // Викликати кастомну подію для оновлення Header
    window.dispatchEvent(new Event('cartUpdated'));

    // Показати toast сповіщення
    setToastMessage(`✓ "${item.name}" додано до кошика!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        items: cart.map((item) => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: getTotalPrice(),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to create order");

      setOrderSuccess(true);
      setCart([]);
      setCustomerInfo({ name: "", phone: "", address: "" });
      setTimeout(() => {
        setShowCheckout(false);
        setOrderSuccess(false);
      }, 3000);
    } catch (error) {
      alert("Помилка при оформленні замовлення: " + error.message);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    window.location.reload(); // Перезавантажити сторінку щоб оновити стан
  };

  const getImageUrl = (product) => {
    if (product.imageUrl) {
      if (product.imageUrl.startsWith("http")) return product.imageUrl;
      return `${API_BASE}${product.imageUrl}`;
    }
    return "/icon/no-image.png";
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
      <Header cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />

      {/* Toast сповіщення */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "100px",
            right: "20px",
            zIndex: 9999,
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1c879e 0%, #00c2a5 100%)",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(28, 135, 158, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontWeight: 600,
              fontSize: "1rem",
              minWidth: "300px",
              animation: "pulse 0.5s ease",
            }}
          >
            <img
              src="/icon/basket.png"
              alt=""
              style={{
                width: "24px",
                height: "24px",
                filter: "brightness(0) invert(1)",
              }}
            />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @media (max-width: 768px) {
          .toast-notification-home {
            top: 80px !important;
            right: 10px !important;
            left: 10px !important;
          }
          .toast-content-home {
            min-width: auto !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Checkout Modal */}
      {showCheckout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowCheckout(false)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "15px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: "#667eea" }}>🛒 Ваш кошик</h2>
            {cart.length === 0 ? (
              <p
                style={{ textAlign: "center", color: "#999", padding: "2rem" }}
              >
                Кошик порожній
              </p>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ color: "#666", fontSize: "0.9rem" }}>
                        {item.price}₴ × {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: "bold", color: "#667eea" }}>
                      {item.price * item.quantity}₴
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    padding: "1rem",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    textAlign: "right",
                    color: "#667eea",
                  }}
                >
                  Всього: {getTotalPrice()}₴
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: "#48bb78",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginTop: "1rem",
                  }}
                  onClick={() => alert("Замовлення оформлено!")}
                >
                  Оформити замовлення
                </button>
              </>
            )}
            <button
              style={{
                width: "100%",
                padding: "0.8rem",
                background: "#e2e8f0",
                color: "#2d3748",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "1rem",
              }}
              onClick={() => setShowCheckout(false)}
            >
              Закрити
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)",
          padding: "2rem 2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "3.5rem",
              margin: "0 0 1rem",
              color: "#2d3748",
              fontWeight: "bold",
            }}
          >
            Свіжі суші за 30 хвилин!
          </h2>
          <p
            style={{
              fontSize: "1.5rem",
              color: "#4a5568",
              marginBottom: "2rem",
            }}
          >
            Преміум якість • Безкоштовна доставка від 500₴ • Акції щодня
          </p>
          <div style={{ margin: "2rem 0", display: "flex", justifyContent: "center" }}>
            <img 
              src="/icon/RollAndGo.png" 
              alt="Roll & Go Logo" 
              style={{ 
                maxWidth: "400px", 
                width: "15%", 
                height: "auto",
                borderRadius: "50%",
                filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
              }} 
            />
          </div>
          <button
            onClick={() => navigate("/menu")}
            style={{
              background: "#ff6b6b",
              color: "white",
              border: "none",
              padding: "1rem 3rem",
              fontSize: "1.3rem",
              borderRadius: "50px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 15px rgba(255,107,107,0.4)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            Замовити зараз
          </button>
        </div>
      </section>

      {/* Promotions */}
      {/* <section
        style={{
          padding: "1rem 2rem",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}
        >
          <h3 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>
            Акції тижня
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "2rem",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <h4 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                Друга доставка -50%
              </h4>
              <p>При замовленні на суму від 800₴</p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "2rem",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <h4 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                Безкоштовна доставка
              </h4>
              <p>Для всіх замовлень від 500₴</p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "2rem",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <h4 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                Сет дня -30%
              </h4>
              <p>Щодня новий сет зі знижкою</p>
            </div>
          </div>
        </div>
      </section> */}


      {/* Popular Items */}
      <section id="menu" style={{ padding: "1rem 1rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h3
            style={{
              textAlign: "center",
              fontSize: "2.5rem",
              marginBottom: "2rem",
              color: "#2d3748",
            }}
          >
            Популярні роли
          </h3>
          {loading ? (
            <div style={{ textAlign: "center", fontSize: "1.5rem" }}>
              Завантаження...
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2rem",
              }}
            >
              {menuItems.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: "white",
                    borderRadius: "15px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/product/${item._id}`)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.03)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div
                    style={{
                      height: "200px",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={getImageUrl(item)}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <h4
                      style={{
                        margin: "0 0 0.5rem",
                        fontSize: "1.5rem",
                        color: "#2d3748",
                      }}
                    >
                      {item.name}
                    </h4>
                    <p
                      style={{
                        color: "#718096",
                        fontSize: "0.9rem",
                        marginBottom: "1rem",
                      }}
                    >
                      {item.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "#667eea",
                        }}
                      >
                        {item.price}₴
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Запобігти спрацюванню onClick картки
                          addToCart({
                            id: item._id,
                            _id: item._id,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            imageUrl: item.imageUrl,
                          });
                        }}
                        style={{
                          background: "#48bb78",
                          color: "white",
                          border: "none",
                          padding: "0.7rem 1.5rem",
                          borderRadius: "25px",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Додати
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Advantages */}
      <section style={{ padding: "1rem 2rem", background: "#f7fafc" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h3
            style={{
              textAlign: "center",
              fontSize: "2.5rem",
              marginBottom: "3rem",
              color: "#2d3748",
            }}
          >
            Чому обирають нас?
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              {
                title: "Свіжа риба",
                text: "Щоденні поставки з перевірених постачальників",
              },
              {
                title: "Швидка доставка",
                text: "Доставимо за 30-40 хвилин",
              },
              {
                title: "Досвідчені шефи",
                text: "Японські кухарі з 10+ років досвіду",
              },
              {
                title: "Зручна оплата",
                text: "Готівка, картка (Visa, MasterCard)",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "15px",
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "transform 0.3s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-10px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <h4
                  style={{
                    fontSize: "1.3rem",
                    margin: "0 0 0.5rem",
                    color: "#2d3748",
                  }}
                >
                  {item.title}
                </h4>
                <p style={{ color: "#718096", margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Delivery Info */}
      <section
        id="delivery"
        style={{ padding: "1rem 2rem", background: "#f7fafc" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h3
            style={{
              textAlign: "center",
              fontSize: "2.5rem",
              marginBottom: "1rem",
              color: "#2d3748",
            }}
          >
            Доставка та оплата
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "1rem",
                  color: "#667eea",
                }}
              >
                Доставка
              </h4>
              <ul style={{ lineHeight: "1.8", color: "#4a5568" }}>
                <li>Безкоштовно від 500₴</li>
                <li>30-40 хвилин по Києву</li>
                <li>Доставка в область - від 80₴</li>
                {/* <li>Відстежування замовлення онлайн</li> */}
              </ul>
            </div>
            <div>
              <h4
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "1rem",
                  color: "#667eea",
                }}
              >
                Оплата
              </h4>
              <ul style={{ lineHeight: "1.8", color: "#4a5568" }}>
                <li>Готівка кур'єру</li>
                <li>Картою кур'єру (Visa, MasterCard)</li>
                {/* <li>LiqPay, Apple Pay, Google Pay</li> */}
                <li>Безпечні платежі</li>
              </ul>
            </div>
            <div>
              <h4
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "1rem",
                  color: "#667eea",
                }}
              >
                Графік роботи
              </h4>
              <ul style={{ lineHeight: "1.8", color: "#4a5568" }}>
                <li>Пн-Чт: 10:00 - 22:00</li>
                <li>Пт-Сб: 10:00 - 01:00</li>
                <li>Неділя: 11:00 - 23:00</li>
                {/* <li>Без вихідних!</li> */}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section id="reviews" style={{ padding: "4rem 2rem" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
              <h3
                style={{
                  fontSize: "2.5rem",
                  margin: 0,
                  color: "#2d3748",
                }}
              >
                Відгуки клієнтів
              </h3>
              <button
                onClick={() => navigate("/reviews")}
                style={{
                  background: "linear-gradient(135deg, #1c879e 0%, #00c2a5 100%)",
                  color: "white",
                  border: "none",
                  padding: "1rem 2rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 15px rgba(28, 135, 158, 0.3)",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(28, 135, 158, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(28, 135, 158, 0.3)";
                }}
              >
                Всі відгуки →
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review._id}
                  style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "15px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "2px solid transparent",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(28, 135, 158, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(28, 135, 158, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div style={{ marginBottom: "1rem" }}>
                    {[...Array(review.rating)].map((_, i) => (
                      <span
                        key={i}
                        style={{ color: "#fbbf24", fontSize: "1.5rem" }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p
                    style={{
                      color: "#4a5568",
                      fontStyle: "italic",
                      marginBottom: "1rem",
                      lineHeight: "1.6",
                    }}
                  >
                    "{review.text}"
                  </p>
                  <p style={{ fontWeight: "bold", color: "#2d3748" }}>
                    — {review.name}
                  </p>
                  {review.products && review.products.length > 0 && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {review.products.map((product) => (
                          <span
                            key={product._id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              padding: "0.25rem 0.5rem",
                              background: "linear-gradient(135deg, rgba(28, 135, 158, 0.1) 0%, rgba(0, 194, 165, 0.1) 100%)",
                              border: "1px solid rgba(28, 135, 158, 0.2)",
                              borderRadius: "12px",
                              fontSize: "0.8rem",
                              color: "#1c879e",
                              fontWeight: "600",
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>{product.image}</span>
                            {product.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        id="contacts"
        style={{ background: "#2d3748", color: "white", padding: "1rem" }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
          }}
        >
          <div>
            <h4 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Roll & Go
            </h4>
            <p style={{ color: "#cbd5e0" }}>
              Найсвіжіші суші в Києві з 2015 року
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
              Контакти
            </h4>
            <p style={{ color: "#cbd5e0", margin: "0.5rem 0" }}>
               +38 (044) 123-45-67
            </p>
            <p style={{ color: "#cbd5e0", margin: "0.5rem 0" }}>
               info@rollandgo.ua
            </p>
            <p style={{ color: "#cbd5e0", margin: "0.5rem 0" }}>
               Київ, вул. Хрещатик, 1
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
              Соціальні мережі
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a 
                href="#" 
                style={{ 
                  color: "#cbd5e0", 
                  textDecoration: "none",
                  fontSize: "1rem",
                  transition: "color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.color = "white"}
                onMouseOut={(e) => e.target.style.color = "#cbd5e0"}
              >
                 Instagram
              </a>
              <a 
                href="#" 
                style={{ 
                  color: "#cbd5e0", 
                  textDecoration: "none",
                  fontSize: "1rem",
                  transition: "color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.color = "white"}
                onMouseOut={(e) => e.target.style.color = "#cbd5e0"}
              >
                 Facebook
              </a>
              <a 
                href="#" 
                style={{ 
                  color: "#cbd5e0", 
                  textDecoration: "none",
                  fontSize: "1rem",
                  transition: "color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.color = "white"}
                onMouseOut={(e) => e.target.style.color = "#cbd5e0"}
              >
                 Twitter
              </a>
              {/* <a 
                href="#" 
                style={{ 
                  color: "#cbd5e0", 
                  textDecoration: "none",
                  fontSize: "1rem",
                  transition: "color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.color = "white"}
                onMouseOut={(e) => e.target.style.color = "#cbd5e0"}
              >
                📱 TikTok
              </a> */}
            </div>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid #4a5568",
            color: "#cbd5e0",
          }}
        >
          <p>© 2025 Roll & Go . Всі права захищено.</p>
        </div>
      </footer>
    </div>
  );
}
