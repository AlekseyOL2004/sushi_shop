import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Reviews.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Reviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    text: "",
    products: [],
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, menuRes] = await Promise.all([
        fetch(`${API_BASE}/reviews`),
        fetch(`${API_BASE}/menu`),
      ]);

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!currentUser) {
      alert("Будь ласка, увійдіть в систему щоб залишити відгук");
      navigate("/login");
      return;
    }
    setEditingReview(null);
    setFormData({
      rating: 5,
      text: "",
      products: [],
    });
    setShowModal(true);
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      text: review.text,
      products: review.products?.map((p) => p._id) || [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReview(null);
    setFormData({ rating: 5, text: "", products: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.text.trim() || formData.text.length < 10) {
      setToastMessage("Відгук має містити мінімум 10 символів");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const url = editingReview
        ? `${API_BASE}/reviews/${editingReview._id}`
        : `${API_BASE}/reviews`;

      const method = editingReview ? "PATCH" : "POST";

      const body = editingReview
        ? {
            userId: currentUser._id,
            ...formData,
          }
        : {
            userId: currentUser._id,
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            ...formData,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      setToastMessage(
        editingReview
          ? "Відгук успішно оновлено!"
          : "Дякуємо за ваш відгук!"
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      await fetchData();
      closeModal();
    } catch (error) {
      setToastMessage(`Помилка: ${error.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDeleteRequest = (reviewId) => {
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewToDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      setToastMessage("Відгук видалено!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      await fetchData();
    } catch (error) {
      setToastMessage(`Помилка: ${error.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  const canEdit = (review) => {
    if (!currentUser) return false;
    return (
      currentUser.role === "admin" ||
      review.userId._id === currentUser._id
    );
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/icon/no-image.png";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_BASE}${imageUrl}`;
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="reviews-page">
      <Header />

      {/* Toast сповіщення */}
      {showToast && (
        <div className="toast-notification-review">
          <div className="toast-content-review">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="reviews-container">
        <div className="reviews-header">
          <div>
            <h1>Відгуки клієнтів</h1>
            <p className="reviews-subtitle">
              Поділіться своїм досвідом з нашими стравами
            </p>
          </div>
          {currentUser && (
            <button onClick={openCreateModal} className="add-review-btn">
              <img src="/icon/reviews.png" alt="" />
              Додати відгук
            </button>
          )}
        </div>

        {/* Відгуки */}
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <h3>Поки що немає відгуків</h3>
            <p>Станьте першим, хто залишить відгук!</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="review-author">
                    <img
                      src="/icon/profile.png"
                      alt=""
                      className="author-icon"
                    />
                    <div>
                      <strong>{review.name}</strong>
                      <p className="review-date">
                        {new Date(review.createdAt).toLocaleDateString("uk-UA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`star ${i < review.rating ? "filled" : ""}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p className="review-text">{review.text}</p>

                {review.products && review.products.length > 0 && (
                  <div className="review-products">
                    <h4>Товари:</h4>
                    <div className="products-list">
                      {review.products.map((product) => (
                        <div key={product._id} className="product-chip">
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="product-chip-image"
                              style={{ width: "20px", height: "20px", objectFit: "cover", borderRadius: "4px" }}
                            />
                          ) : (
                            <span className="product-emoji">📦</span>
                          )}
                          <span>{product.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canEdit(review) && (
                  <div className="review-actions">
                    <button
                      onClick={() => openEditModal(review)}
                      className="edit-review-btn"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(review._id)}
                      className="delete-review-btn"
                    >
                      Видалити
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка підтвердження видалення */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content-delete-review" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-delete-review">
              <h2>Підтвердження видалення</h2>
            </div>
            <div className="modal-body-delete-review">
              <p>Ви впевнені, що хочете видалити цей відгук?</p>
              <p className="warning-text-delete-review">
                Цю дію не можна буде скасувати!
              </p>
            </div>
            <div className="modal-actions-delete-review">
              <button
                onClick={handleDeleteConfirm}
                className="confirm-delete-btn-review"
              >
                Так, видалити
              </button>
              <button
                onClick={handleDeleteCancel}
                className="cancel-delete-btn-review"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка створення/редагування відгуку */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content-review" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingReview ? "Редагувати відгук" : "Новий відгук"}
              </h2>
              <button onClick={closeModal} className="close-modal-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="review-form">
              {/* Оцінка */}
              <div className="form-group rating-group">
                <label>
                  <img src="/icon/reviews.png" alt="" className="label-icon" />
                  Ваша оцінка
                </label>
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, rating: star })
                      }
                      className={`star-btn ${
                        formData.rating >= star ? "active" : ""
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="rating-text">
                  {formData.rating === 5 && "Відмінно!"}
                  {formData.rating === 4 && "Добре"}
                  {formData.rating === 3 && "Нормально"}
                  {formData.rating === 2 && "Погано"}
                  {formData.rating === 1 && "Жахливо"}
                </span>
              </div>

              {/* Текст відгуку */}
              <div className="form-group">
                <label>
                  <img src="/icon/reviews.png" alt="" className="label-icon" />
                  Ваш відгук
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  placeholder="Розкажіть нам про ваш досвід... Що вам сподобалося? Що можна покращити?"
                  rows={8}
                  required
                  minLength={10}
                  maxLength={1000}
                  className="review-textarea"
                />
                <div className="textarea-footer">
                  <span className="char-count">
                    {formData.text.length} / 1000 символів
                  </span>
                  <span className={`char-warning ${formData.text.length < 10 ? "visible" : ""}`}>
                    Мінімум 10 символів
                  </span>
                </div>
              </div>

              {/* Товари */}
              <div className="form-group products-group">
                <label>
                  <img src="/icon/menu.png" alt="" className="label-icon" />
                  Товари які ви спробували
                  <span className="optional-label">(необов'язково)</span>
                </label>
                <p className="field-description">
                  Оберіть страви, про які пишете у відгуку
                </p>
                
                <div className="review-products-grid">
                  {menuItems.map((item) => (
                    <label 
                      key={item._id} 
                      className={`review-product-card ${
                        formData.products.includes(item._id) ? "selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.products.includes(item._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              products: [...formData.products, item._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              products: formData.products.filter(
                                (id) => id !== item._id
                              ),
                            });
                          }
                        }}
                        className="product-checkbox-input"
                      />
                      <div className="review-product-card-content">
                        <div className="review-product-image">
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        </div>
                        <div className="review-product-info">
                          <span className="review-product-name">{item.name}</span>
                          <span className="review-product-price">{item.price}₴</span>
                        </div>
                        <div className="review-product-check">
                          <div className="review-checkmark">✓</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {formData.products.length > 0 && (
                  <div className="selected-count">
                    Обрано: {formData.products.length} {formData.products.length === 1 ? "товар" : "товарів"}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn" disabled={formData.text.length < 10}>
                  <img src="/icon/done.png" alt="" />
                  {editingReview ? "Оновити відгук" : "Додати відгук"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="cancel-btn"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
