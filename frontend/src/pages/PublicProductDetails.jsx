import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Toast from "../components/Toast";
import "./PublicProductDetails.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const WEIGHT_UNITS = {
  g: { label: "грамів", short: "г", title: "Вага" },
  l: { label: "літрів", short: "л", title: "Об'єм" },
  pcs: { label: "штук", short: "шт", title: "Кількість" },
};

export default function PublicProductDetails() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, [productId]);

  useEffect(() => {
    // Завантажити кошик з localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/menu/${productId}`),
        fetch(`${API_BASE}/categories?active=true`),
      ]);

      if (productRes.ok) {
        const data = await productRes.json();
        setProduct(data);
      } else {
        throw new Error("Product not found");
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      alert("Помилка завантаження товару: " + error.message);
      navigate("/menu");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = (key) => {
    return (
      categories.find((cat) => cat.key === key) || {
        label: key,
        icon: "📦",
        color: "#667eea",
      }
    );
  };

  const handleAddToCart = () => {
    const newItem = { ...product, quantity };
    const existingItem = cart.find((i) => i._id === product._id);

    let newCart;
    if (existingItem) {
      newCart = cart.map((i) =>
        i._id === product._id ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      newCart = [...cart, newItem];
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    setToastMessage(`Додано ${quantity} × "${product.name}" в кошик!`);
    setShowToast(true);
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/icon/no-image.png";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_BASE}${imageUrl}`;
  };

  if (loading || !product) {
    return <div className="loading">Завантаження...</div>;
  }

  const categoryData = getCategoryData(product.category);
  const weightUnit = WEIGHT_UNITS[product.weightUnit] || WEIGHT_UNITS.g;

  return (
    <div className="public-product-details">
      <Header
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => alert(`У кошику ${cart.length} товарів`)}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="product-content">
        <div className="product-main-section">
          <div className="product-image-section">
            <div className="product-image-huge">
              {product.imageUrl ? (
                <img
                  src={getImageUrl(product.imageUrl)}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src="/icon/no-image.png"
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              )}
            </div>
            {!product.isAvailable && (
              <div className="unavailable-overlay">
                <span> Товар недоступний</span>
              </div>
            )}
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            <div className="product-badges">
              <span
                className="category-badge"
                style={{ backgroundColor: categoryData.color }}
              >
                {categoryData.icon} {categoryData.label}
              </span>
              <span
                className={`availability-badge ${
                  product.isAvailable ? "available" : "unavailable"
                }`}
              >
                {product.isAvailable
                  ? " В наявності"
                  : " Немає в наявності"}
              </span>
            </div>

            <div className="product-price-section">
              <span className="price-label">Ціна:</span>
              <span className="price-value">{product.price}₴</span>
              {product.weight && (
                <span className="price-per-gram">
                  ({(product.price / product.weight).toFixed(2)}₴ /{" "}
                  {weightUnit.short})
                </span>
              )}
            </div>

            {product.isAvailable && (
              <div className="quantity-section">
                <label>Кількість:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                  >
                    −
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                <span className="total-price">
                  Всього: <strong>{product.price * quantity}₴</strong>
                </span>
              </div>
            )}

            {product.isAvailable && (
              <button onClick={handleAddToCart} className="add-to-cart-btn">
                 Додати в кошик
              </button>
            )}
          </div>
        </div>

        <div className="product-details-grid">
          <div className="detail-card">
            <h3> Опис</h3>
            <p>{product.description}</p>
          </div>

          {product.ingredients && (
            <div className="detail-card">
              <h3> Інгредієнти</h3>
              <p>{product.ingredients}</p>
            </div>
          )}

          {product.weight && (
            <div className="detail-card">
              <h3>
                {weightUnit.icon} {weightUnit.title}
              </h3>
              <p className="weight-info">
                {product.weight} {weightUnit.label}
              </p>
            </div>
          )}

          <div className="detail-card">
            <h3>ℹ️ Додаткова інформація</h3>
            <ul className="info-list">
              <li>
                <strong>Категорія:</strong> {categoryData.icon}{" "}
                {categoryData.label}
              </li>
              <li>
                <strong>Артикул:</strong>{" "}
                <code>{product._id.slice(-8).toUpperCase()}</code>
              </li>
              {product.weight && (
                <li>
                  <strong>{weightUnit.title}:</strong> {product.weight}
                  {weightUnit.short}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
