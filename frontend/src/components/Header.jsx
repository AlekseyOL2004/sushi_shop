import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Header.css";

export default function Header({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    navigate("/");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo" onClick={() => handleNavigation("/")}>
              Roll & Go
            </h1>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>

            <nav className="main-nav" role="navigation">
              <button
                onClick={() => navigate("/")}
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                <img
                  src="/icon/home.png"
                  alt="Головна"
                  style={{
                    width: "18px",
                    height: "18px",
                    minWidth: "18px",
                    minHeight: "18px",
                  }}
                />
                Головна
              </button>
              <button
                onClick={() => navigate("/menu")}
                className={`nav-link ${isActive("/menu") ? "active" : ""}`}
              >
                <img
                  src="/icon/menu.png"
                  alt="Меню"
                  style={{
                    width: "18px",
                    height: "18px",
                    minWidth: "18px",
                    minHeight: "18px",
                  }}
                />
                Меню
              </button>
              {currentUser && (
                <button
                  onClick={() => navigate("/my-orders")}
                  className={`nav-link ${
                    isActive("/my-orders") ? "active" : ""
                  }`}
                >
                  <img
                    src="/icon/box.png"
                    alt="Замовлення"
                    style={{
                      width: "18px",
                      height: "18px",
                      minWidth: "18px",
                      minHeight: "18px",
                    }}
                  />
                  Замовлення
                </button>
              )}
              <a href="/#reviews" className="nav-link">
                <img
                  src="/icon/reviews.png"
                  alt="Відгуки"
                  style={{
                    width: "18px",
                    height: "18px",
                    minWidth: "18px",
                    minHeight: "18px",
                  }}
                />
                Відгуки
              </a>
              <a href="/#delivery" className="nav-link">
                <img
                  src="/icon/delivery.png"
                  alt="Доставка"
                  style={{
                    width: "18px",
                    height: "18px",
                    minWidth: "18px",
                    minHeight: "18px",
                  }}
                />
                Доставка
              </a>
            </nav>
          </div>

          <div className="header-right">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className={`user-btn ${isActive("/profile") ? "active" : ""}`}
                  title="Мій профіль"
                >
                  <img
                    src="/icon/profile.png"
                    alt="Профіль"
                    style={{
                      width: "18px",
                      height: "18px",
                      minWidth: "18px",
                      minHeight: "18px",
                    }}
                  />
                  {currentUser.firstName}
                </button>

                {(currentUser.role === "manager" ||
                  currentUser.role === "moderator" ||
                  currentUser.role === "admin") && (
                  <button
                    onClick={() => navigate("/orders/manage")}
                    className={`admin-btn ${
                      isActive("/orders/manage") ? "active" : ""
                    }`}
                    title="Управління замовленнями"
                  >
                    <img
                      src="/icon/box2.png"
                      alt="Замовлення"
                      style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        minHeight: "18px",
                      }}
                    />
                  </button>
                )}

                {(currentUser.role === "moderator" ||
                  currentUser.role === "admin") && (
                  <>
                    <button
                      onClick={() => navigate("/orders/statistics")}
                      className={`admin-btn ${
                        isActive("/orders/statistics") ? "active" : ""
                      }`}
                      title="Статистика"
                    >
                      <img
                        src="/icon/statistics.png"
                        alt="Статистика"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                        }}
                      />
                    </button>
                    <button
                      onClick={() => navigate("/products/manage")}
                      className={`admin-btn ${
                        isActive("/products") ? "active" : ""
                      }`}
                      title="Управління товарами"
                    >
                      <img
                        src="/icon/goods-management.png"
                        alt="Товари"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                        }}
                      />
                    </button>
                    <button
                      onClick={() => navigate("/categories")}
                      className={`admin-btn ${
                        isActive("/categories") ? "active" : ""
                      }`}
                      title="Категорії"
                    >
                      <img
                        src="/icon/category.png"
                        alt="Категорії"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                        }}
                      />
                    </button>
                  </>
                )}

                {currentUser.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className={`admin-btn ${
                      isActive("/admin") ? "active" : ""
                    }`}
                    title="Адмін панель"
                  >
                    <img
                      src="/icon/admin-panel.png"
                      alt="Адмін"
                      style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        minHeight: "18px",
                      }}
                    />
                  </button>
                )}

                <button onClick={handleLogout} className="logout-btn">
                  <img
                    src="/icon/exit.png"
                    alt="Вийти"
                    style={{
                      width: "18px",
                      height: "18px",
                      minWidth: "18px",
                      minHeight: "18px",
                    }}
                  />
                  Вийти
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className={`login-btn ${isActive("/login") ? "active" : ""}`}
                >
                  <img
                    src="/icon/profile.png"
                    alt="Вхід"
                    style={{
                      width: "18px",
                      height: "18px",
                      minWidth: "18px",
                      minHeight: "18px",
                    }}
                  />
                  Вхід
                </button>
                <button
                  onClick={() => navigate("/registration")}
                  className={`register-btn ${
                    isActive("/registration") ? "active" : ""
                  }`}
                >
                  <img
                    src="/icon/profile.png"
                    alt="Реєстрація"
                    style={{
                      width: "18px",
                      height: "18px",
                      minWidth: "18px",
                      minHeight: "18px",
                    }}
                  />
                  Реєстрація
                </button>
              </>
            )}

            <button
              onClick={() => navigate("/checkout")}
              className={`cart-btn ${isActive("/checkout") ? "active" : ""}`}
            >
              <span className="cart-icon">
                <img
                  src="/icon/basket.png"
                  alt="Кошик"
                  style={{
                    width: "16px",
                    height: "16px",
                    minWidth: "16px",
                    minHeight: "16px",
                  }}
                />
              </span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Мобільне меню */}
      <nav className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`}>
        <button
          onClick={() => handleNavigation("/")}
          className={`nav-link ${isActive("/") ? "active" : ""}`}
        >
          <img
            src="/icon/home.png"
            alt="Головна"
            style={{
              width: "18px",
              height: "18px",
              minWidth: "18px",
              minHeight: "18px",
            }}
          />
          Головна
        </button>
        <button
          onClick={() => handleNavigation("/menu")}
          className={`nav-link ${isActive("/menu") ? "active" : ""}`}
        >
          <img
            src="/icon/menu.png"
            alt="Меню"
            style={{
              width: "18px",
              height: "18px",
              minWidth: "18px",
              minHeight: "18px",
            }}
          />
          Меню
        </button>
        {currentUser && (
          <>
            <button
              onClick={() => handleNavigation("/my-orders")}
              className={`nav-link ${isActive("/my-orders") ? "active" : ""}`}
            >
              <img
                src="/icon/box.png"
                alt="Замовлення"
                style={{
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  minHeight: "18px",
                }}
              />
              Мої замовлення
            </button>
            <button
              onClick={() => handleNavigation("/profile")}
              className={`nav-link ${isActive("/profile") ? "active" : ""}`}
            >
              <img
                src="/icon/profile.png"
                alt="Профіль"
                style={{
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  minHeight: "18px",
                }}
              />
              Профіль
            </button>
          </>
        )}
        <button
          onClick={() => {
            closeMobileMenu();
            window.location.href = "/#reviews";
          }}
          className="nav-link"
        >
          <img
            src="/icon/reviews.png"
            alt="Відгуки"
            style={{
              width: "18px",
              height: "18px",
              minWidth: "18px",
              minHeight: "18px",
            }}
          />
          Відгуки
        </button>
        <button
          onClick={() => {
            closeMobileMenu();
            window.location.href = "/#delivery";
          }}
          className="nav-link"
        >
          <img
            src="/icon/delivery.png"
            alt="Доставка"
            style={{
              width: "18px",
              height: "18px",
              minWidth: "18px",
              minHeight: "18px",
            }}
          />
          Доставка
        </button>
      </nav>
    </>
  );
}
