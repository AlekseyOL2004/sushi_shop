import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Toast from "../components/Toast";
import "./ProductDetails.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menu/${id}`);
      if (!res.ok) throw new Error("Товар не знайдено");
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Не вдалося завантажити категорії");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Помилка завантаження категорій:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await fetch(`${API_BASE}/reviews`);
      if (res.ok) {
        const allReviews = await res.json();
        // Фільтруємо відгуки, які містять цей товар
        const productReviews = allReviews.filter((review) =>
          review.products?.some((product) => product._id === id)
        );
        setReviews(productReviews);
      }
    } catch (error) {
      console.error("Помилка завантаження відгуків:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getIngredientsArray = () => {
    if (!product || !product.ingredients) return [];
    
    if (Array.isArray(product.ingredients)) {
      return product.ingredients;
    }
    
    if (typeof product.ingredients === "string") {
      return product.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    
    return [];
  };

  const addToCart = () => {
    const existingItem = cart.find((i) => i._id === product._id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((i) =>
        i._id === product._id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    // Викликати кастомну подію для оновлення Header
    window.dispatchEvent(new Event('cartUpdated'));
    
    setToastMessage(`Додано ${quantity} шт. до кошика!`);
    setShowToast(true);
    setQuantity(1);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="product-details-page">
        <Header cartCount={cartCount} />
        <div className="loading">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-page">
        <Header cartCount={cartCount} />
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <Header cartCount={cartCount} />
        <div className="error-message">Товар не знайдено</div>
      </div>
    );
  }

  const WEIGHT_UNITS = {
    g: { label: "грамів", short: "г", title: "Вага" },
    l: { label: "літрів", short: "л", title: "Об'єм" },
    pcs: { label: "штук", short: "шт", title: "Кількість" },
  };

  const weightUnit = WEIGHT_UNITS[product.weightUnit] || WEIGHT_UNITS.g;

  return (
    <div className="product-details-page">
      <Header cartCount={cartCount} />

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="product-details-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Назад
        </button>

        <div className="product-details-card">
          {/* Ліва колонка */}
          <div className="product-left-column">
            <div className="product-details-header" style={{ textAlign: "center" }}>
              <h1 className="product-title">{product.name}</h1>
              <div className="product-price-block">
                <div className="price-main">
                  <span className="price-value">{product.price}</span>
                  <span className="price-currency">₴</span>
                </div>
                {product.weight && (
                  <div className="price-per-unit">
                    за {product.weight} {weightUnit.short}
                    <span className="price-calculation">
                      ({(product.price / product.weight).toFixed(2)}₴/{weightUnit.short})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="product-image-large">{product.image}</div>

            {/* Вага та категорія в лівій колонці */}
            <div className="left-column-info">
              <div className="info-item-small">
                <img src="/icon/scale.png" alt="" className="info-icon-small" />
                <div>
                  <span className="info-label-small">{weightUnit.title}</span>
                  <span className="info-value-small">
                    {product.weight} {weightUnit.label}
                  </span>
                </div>
              </div>

              <div className="info-item-small">
                <img src="/icon/category.png" alt="" className="info-icon-small" />
                <div>
                  <span className="info-label-small">Категорія</span>
                  <span className="info-value-small">
                    {categories.find((c) => c.key === product.category)?.label ||
                      product.category}
                  </span>
                </div>
              </div>

              <div className="info-item-small">
                <img src="/icon/delivery.png" alt="" className="info-icon-small" />
                <div>
                  <span className="info-label-small">Доставка</span>
                  <span className="info-value-small">30-40 хв</span>
                </div>
              </div>
            </div>

            {/* Блок додавання до кошика */}
            <div className="add-to-cart-section">
              <div className="quantity-selector">
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
              <button
                onClick={addToCart}
                className="add-to-cart-main-btn"
                disabled={!product.isAvailable}
              >
                <img src="/icon/basket.png" alt="" style={{ width: "18px", height: "18px", filter: "brightness(0) invert(1)" }} />
                Додати до кошика
              </button>
            </div>
          </div>

          {/* Права колонка */}
          <div className="product-right-column">
            <div className="product-details-body">
              <div className="product-content-grid">
                <div className="product-section full-width">
                  <h2 className="section-title">
                    <img src="/icon/reviews.png" alt="" className="section-icon" />
                    Опис
                  </h2>
                  <p className="product-description-text">{product.description}</p>
                </div>

                {getIngredientsArray().length > 0 && (
                  <div className="product-section full-width">
                    <h2 className="section-title">
                      {/* <img src="/icon/sushi.png" alt="" className="section-icon" /> */}
                      Інгредієнти
                    </h2>
                    <ul className="ingredients-list">
                      {getIngredientsArray().map((ingredient, index) => (
                        <li key={index} className="ingredient-tag">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="product-section full-width recommendations-section">
                  <h2 className="section-title">
                    <img src="/icon/chopsticks.png" alt="" className="section-icon" />
                    Рекомендації по споживанню
                  </h2>
                  <div className="recommendations-grid">
                    <div className="recommendation-card">
                      <div className="recommendation-icon">
                        <img src="/icon/ready.png" alt="" />
                      </div>
                      <div className="recommendation-content">
                        <h4>Свіжість</h4>
                        <p>Краще споживати одразу після отримання для найкращого смаку</p>
                      </div>
                    </div>

                    <div className="recommendation-card">
                      <div className="recommendation-icon">
                        <img src="/icon/clock.png" alt="" />
                      </div>
                      <div className="recommendation-content">
                        <h4>Зберігання</h4>
                        <p>В холодильнику не більше 24 годин при температурі +2...+6°C</p>
                      </div>
                    </div>

                    <div className="recommendation-card">
                      <div className="recommendation-icon">
                        <img src="/icon/chopsticks.png" alt="" />
                      </div>
                      <div className="recommendation-content">
                        <h4>Подача</h4>
                        <p>Можна замовити навчальні або звичайні палички безкоштовно</p>
                      </div>
                    </div>

                    <div className="recommendation-card">
                      <div className="recommendation-icon">
                        <img src="/icon/delivery.png" alt="" />
                      </div>
                      <div className="recommendation-content">
                        <h4>Доставка</h4>
                        <p>Безкоштовна доставка від 500₴, час доставки 30-40 хвилин</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Секція відгуків */}
        {!reviewsLoading && reviews.length > 0 && (
          <div className="product-reviews-section">
            <div className="reviews-section-header">
              <h2>
                <img src="/icon/reviews.png" alt="" className="section-icon" />
                Відгуки про цей товар ({reviews.length})
              </h2>
              <button
                onClick={() => navigate("/reviews")}
                className="all-reviews-btn"
              >
                Всі відгуки →
              </button>
            </div>

            <div className="product-reviews-grid">
              {reviews.map((review) => (
                <div key={review._id} className="product-review-card">
                  <div className="review-card-header">
                    <div className="review-author-info">
                      <img
                        src="/icon/profile.png"
                        alt=""
                        className="review-author-icon"
                      />
                      <div>
                        <strong>{review.name}</strong>
                        <p className="review-date-text">
                          {new Date(review.createdAt).toLocaleDateString("uk-UA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="review-rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`star-icon ${i < review.rating ? "filled" : ""}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="review-text-content">{review.text}</p>

                  {review.products && review.products.length > 1 && (
                    <div className="review-other-products">
                      <span className="other-products-label">Також оцінено:</span>
                      <div className="other-products-list">
                        {review.products
                          .filter((p) => p._id !== id)
                          .map((product) => (
                            <span
                              key={product._id}
                              className="other-product-chip"
                              onClick={() => navigate(`/product/${product._id}`)}
                            >
                              <span className="product-emoji-small">{product.image}</span>
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
        )}
      </div>
    </div>
  );
}
