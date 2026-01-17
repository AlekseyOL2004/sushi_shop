import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Menu.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3002";

const WEIGHT_UNITS = {
  g: "г",
  l: "л",
  pcs: "шт"
};

export default function Menu() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    // Завантажити кошик з localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [menuRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/menu?available=true`),
        fetch(`${API_BASE}/categories?active=true`),
      ]);

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    if (!item.isAvailable) return;

    // Перевірка що товар має _id
    if (!item._id) {
      console.error('Item without _id:', item);
      alert('Помилка: товар не має ідентифікатора');
      return;
    }

    const existingItem = cart.find((i) => i._id === item._id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((i) =>
        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      // Зберігаємо всі важливі поля включно з _id та imageUrl
      newCart = [...cart, { 
        _id: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        imageUrl: item.imageUrl, // Додаємо imageUrl
        category: item.category,
        quantity: 1 
      }];
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    window.dispatchEvent(new Event('cartUpdated'));

    setToastMessage(`✓ "${item.name}" додано до кошика!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Статистика по категоріях
  const categoryStats = {};
  menuItems.forEach((item) => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });

  // Знайти категорію за ключем
  const getCategoryData = (key) => {
    return (
      categories.find((cat) => cat.key === key) || {
        label: key,
        icon: "📦",
        color: "#667eea",
      }
    );
  };

  const selectedCategoryData =
    selectedCategory === "all"
      ? { label: "Всі товари", icon: "", color: "#667eea" }
      : getCategoryData(selectedCategory);

  const getImageUrl = (product) => {
    if (product.imageUrl) {
      if (product.imageUrl.startsWith("http")) return product.imageUrl;
      return `${API_BASE}${product.imageUrl}`;
    }
    return "/icon/no-image.png";
  };

  return (
    <div className="menu-page">
      <Header cartCount={cartCount} />

      {/* Toast сповіщення */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <img src="/icon/basket.png" alt="" className="toast-icon" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="menu-container">
        <div className="menu-header">
          <h1>Наше меню</h1>
          <p className="menu-subtitle">Оберіть ваші улюблені страви</p>
        </div>

        {/* Пошук */}
        <div className="search-section">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Пошук страв..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Фільтри */}
        <div className="filters-section">
          <div className="category-filters">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`category-btn ${
                selectedCategory === "all" ? "active" : ""
              }`}
            >
              Всі страви
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`category-btn ${
                  selectedCategory === cat.key ? "active" : ""
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Сітка товарів */}
        {loading ? (
          <div className="loading-state">Завантаження меню...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>Нічого не знайдено</h3>
            <p>Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <div key={item._id} className="menu-card">
                <div className="card-image">
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {!item.isAvailable && (
                    <div className="unavailable-overlay">
                      <span>Немає в наявності</span>
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">{item.name}</h3>
                    <span className="card-category">
                      {categories.find((c) => c.key === item.category)?.label ||
                        item.category}
                    </span>
                  </div>

                  <p className="card-description">{item.description}</p>

                  <div className="card-details">
                    <div className="detail-item">
                      <img
                        src="/icon/scale.png"
                        alt="Вага"
                        className="detail-icon"
                      />
                      <span>
                        {item.weight}{WEIGHT_UNITS[item.weightUnit] || "г"}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="card-price">
                      <span className="price-label">Ціна:</span>
                      <span className="price-value">{item.price}₴</span>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => navigate(`/product/${item._id}`)}
                        className="details-btn"
                        title="Переглянути деталі"
                      >
                        {/* <img src="/icon/eye.png" alt="" /> */}
                        Деталі
                      </button>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.isAvailable}
                        className="add-to-cart-btn"
                        title={
                          item.isAvailable
                            ? "Додати в кошик"
                            : "Немає в наявності"
                        }
                      >
                        <img src="/icon/basket.png" alt="" />
                        Додати
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
