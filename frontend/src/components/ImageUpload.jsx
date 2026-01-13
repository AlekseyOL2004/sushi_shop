import { useState } from 'react';
import './ImageUpload.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function ImageUpload({ currentImageUrl, onImageChange, onImageDelete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const getImageUrl = (url) => {
    if (!url) return '/icon/no-image.png';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Валідація
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Оберіть файл зображення');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Помилка завантаження');
      }

      const data = await res.json();
      onImageChange(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Видалити зображення?')) {
      onImageDelete();
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">Зображення товару</label>
      
      <div className="image-preview-box">
        <img 
          src={getImageUrl(currentImageUrl)} 
          alt="Product preview" 
          className="image-preview"
        />
      </div>

      <div className="image-upload-actions">
        <label className="upload-btn">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? 'Завантаження...' : 'Обрати файл'}
        </label>

        {currentImageUrl && (
          <button
            type="button"
            onClick={handleDelete}
            className="delete-image-btn"
            disabled={uploading}
          >
            Видалити фото
          </button>
        )}
      </div>

      {error && <div className="upload-error">{error}</div>}
      <p className="upload-hint">Максимальний розмір: 5MB. Формати: JPG, PNG, GIF, WEBP</p>
    </div>
  );
}
