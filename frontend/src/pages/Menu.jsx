import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const CATEGORIES = [
  "Сети",
  "Філадельфії",
  "Каліфорнії",
  "Макі роли",
  "Гострі роли",
  "Роли без рису",
  "Запечені роли",
  "Дракони",
  "Суші",
  "Бургери",
  "Гриль роли",
  "Футо макі",
  "Авторські роли",
  "Нігірі і гункані",
  "Салати",
  "Напої",
];

export default function Menu() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Всі");
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/menu`);
        if (!res.ok) throw new Error("Failed to fetch menu");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "Всі"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    alert(`${product.name} додано до кошика!`);
  };

  return (
    <div className="menu-container">
      <header className="menu-header">
        <button onClick={() => navigate("/")} className="home-btn">
          🏠 На головну
        </button>
        <h1>Меню</h1>
        <button className="cart-btn">🛒 Кошик ({cart.length})</button>
      </header>

      <div className="menu-content">
        <aside className="categories-sidebar">
          <h2>Категорії</h2>
          <ul>
            <li
              className={selectedCategory === "Всі" ? "active" : ""}
              onClick={() => setSelectedCategory("Всі")}
            >
              Всі
            </li>
            {CATEGORIES.map((category) => (
              <li
                key={category}
                className={selectedCategory === category ? "active" : ""}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </aside>

        <main className="products-grid">
          {loading ? (
            <p className="no-products">Завантаження...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="no-products">Немає продуктів у цій категорії</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image">{product.image}</div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="description">{product.description}</p>
                  <div className="product-footer">
                    <span className="price">{product.price} грн</span>
                  </div>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}
                  >
                    Додати до кошика
                  </button>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
