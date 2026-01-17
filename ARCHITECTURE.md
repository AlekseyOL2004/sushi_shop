# 🏗️ Архітектура проекту Sushi Shop

Цей документ описує повну структуру проекту **Sushi Shop** — веб-застосунку для замовлення суші з автоматичним деплоєм на Azure.

---

## 📋 Зміст

1. [Загальний огляд](#загальний-огляд)
2. [Повна структура файлів](#повна-структура-файлів)
3. [Backend (API)](#backend-api)
4. [Frontend (React)](#frontend-react)
5. [DevOps та CI/CD](#devops-та-cicd)
6. [Docker конфігурація](#docker-конфігурація)
7. [Azure інфраструктура](#azure-інфраструктура)
8. [Порти та URL](#порти-та-url)

---

## 🎯 Загальний огляд

### Технологічний стек

| Компонент | Технології |
|-----------|------------|
| **Backend** | Node.js 18, Express.js, MongoDB Atlas, Mongoose |
| **Frontend** | React 18, Vite, React Router DOM |
| **DevOps** | Docker, Docker Compose, GitHub Actions |
| **Cloud** | Azure Container Instances, Azure App Service |
| **Database** | MongoDB Atlas (Cloud) |

### Архітектурна діаграма

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                  AlekseyOL2004/sushi_shop                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── Push to 'frontend' branch
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                           │
│  ┌──────────────┐           ┌──────────────┐                │
│  │  Build Job   │  ──────▶  │  Deploy Job  │                │
│  │  npm install │           │  Azure Login │                │
│  │  npm build   │           │  Deploy App  │                │
│  └──────────────┘           └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Azure Web App                             │
│                  ztu-sushi-shop                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Frontend (React/Vite)                             │     │
│  │  https://ztu-sushi-shop.azurewebsites.net         │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼ API Calls                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Backend (Node.js/Express)                         │     │
│  │  Port: 3001                                        │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  MongoDB Database                                  │     │
│  │  Port: 27017                                       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Повна структура файлів

```
c:\University\Магістратура 1 курс\1 семестр\Docker\coursework\Project\
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── 📄 deploy-frontend-azure.yml          # CI/CD workflow для автоматичного деплою
│
├── 📂 api/                                        # Backend сервер
│   ├── 📄 Dockerfile                              # Production Docker образ
│   ├── 📄 Dockerfile.dev                          # Development Docker образ з hot-reload
│   ├── 📄 package.json                            # NPM залежності та скрипти
│   ├── 📄 package-lock.json                       # Lockfile для відтворюваних build
│   ├── 📄 .env.local                              # Локальні змінні оточення (gitignored)
│   ├── 📄 ENV_LOCAL_README.md                     # Документація про .env файли
│   │
│   └── 📂 src/
│       ├── 📄 app.js                              # Express додаток (production entry)
│       ├── 📄 app.local.js                        # Локальний запуск з in-memory MongoDB
│       ├── 📄 createAdmin.js                      # Утиліта створення адміна
│       ├── 📄 updateExistingUsers.js              # Міграція користувачів
│       ├── 📄 fixUsers.js                         # Виправлення даних користувачів
│       ├── 📄 seedData.js                         # Seed даних меню
│       ├── 📄 seedCategories.js                   # Seed категорій
│       │
│       ├── 📂 configuration/
│       │   └── 📄 index.js                        # Конфігурація (PORT, HOST, MONGO_URL)
│       │
│       ├── 📂 models/                             # Mongoose моделі
│       │   ├── 📄 user.js                         # Модель User (email, password, role)
│       │   ├── 📄 menuItem.js                     # Модель MenuItem (name, price, image)
│       │   ├── 📄 category.js                     # Модель Category (key, label)
│       │   └── 📄 review.js                       # Модель Review (rating, text)
│       │
│       ├── 📂 routers/                            # Express маршрути (REST API)
│       │   ├── 📄 user.js                         # GET/POST /users
│       │   ├── 📄 menuItem.js                     # CRUD /menu-items
│       │   ├── 📄 category.js                     # CRUD /categories
│       │   └── 📄 review.js                       # CRUD /reviews
│       │
│       ├── 📂 scripts/
│       │   └── 📄 seed.js                         # Додатковий seed скрипт
│       │
│       └── 📂 uploads/                            # Завантажені файли (зображення страв)
│
├── 📂 frontend/                                   # React клієнт
│   ├── 📄 Dockerfile.prod                         # Production multi-stage build
│   ├── 📄 Dockerfile.dev                          # Development з Vite HMR
│   ├── 📄 package.json                            # React залежності
│   ├── 📄 package-lock.json                       # NPM lockfile
│   ├── 📄 vite.config.js                          # Vite конфігурація (proxy, build)
│   ├── 📄 index.html                              # HTML entry point
│   ├── 📄 .env.production                         # Production env vars (VITE_API_BASE)
│   ├── 📄 FRONTEND_CI_CD_SETUP.md                 # Детальна документація CI/CD
│   │
│   ├── 📂 src/
│   │   ├── 📄 main.jsx                            # React entry point (ReactDOM.render)
│   │   ├── 📄 App.jsx                             # Головний компонент з маршрутизацією
│   │   ├── 📄 App.css                             # Стилі App компонента
│   │   ├── 📄 index.css                           # Глобальні стилі
│   │   │
│   │   ├── 📂 components/                         # React компоненти
│   │   │   ├── 📄 UserForm.jsx                    # Форма реєстрації користувача
│   │   │   ├── 📄 UsersList.jsx                   # Відображення списку користувачів
│   │   │   ├── 📄 MenuItemForm.jsx                # Форма додавання страви
│   │   │   ├── 📄 MenuItemsList.jsx               # Каталог меню
│   │   │   ├── 📄 CategoryForm.jsx                # Управління категоріями
│   │   │   └── 📄 ReviewsList.jsx                 # Відгуки клієнтів
│   │   │
│   │   ├── 📂 pages/                              # Сторінки (React Router)
│   │   │   ├── 📄 Home.jsx
│   │   │   ├── 📄 Menu.jsx
│   │   │   └── 📄 Orders.jsx
│   │   │
│   │   ├── 📂 services/                           # API клієнти (axios)
│   │   │   └── 📄 api.js
│   │   │
│   │   ├── 📂 hooks/                              # Custom React hooks
│   │   │   └── 📄 useMenu.js
│   │   │
│   │   └── 📂 utils/                              # Утилітні функції
│   │       └── 📄 formatPrice.js
│   │
│   ├── 📂 public/                                 # Статичні ресурси
│   │   ├── 📄 vite.svg
│   │   └── 📂 images/
│   │
│   └── 📂 dist/                                   # Build output (створюється npm run build)
│       ├── 📄 index.html
│       ├── 📂 assets/
│       │   ├── 📄 index-[hash].js                 # Зібраний JS
│       │   └── 📄 index-[hash].css                # Зібраний CSS
│       └── 📄 vite.svg
│
├── 📂 scripts/                                    # Bash скрипти для автоматизації
│   └── 📂 azure/
│       ├── 📄 10-create-resource-group-and-webapp.sh   # Створення Azure ресурсів
│       └── 📄 11-create-service-principal.sh           # Створення Service Principal
│
├── 📄 docker-compose.yml                          # Production Docker Compose
├── 📄 docker-compose.dev.yml                      # Development Docker Compose
├── 📄 docker-compose.prod.yml                     # Production MongoDB config
│
├── 📄 Makefile                                    # Зручні команди (make dev, make prod)
│
├── 📄 README.md                                   # Головна документація
├── 📄 ARCHITECTURE.md                             # Цей файл (архітектура проекту)
├── 📄 WEBAPP_API_DEPLOYMENT.md                    # Документація деплою API
│
├── 📄 .gitignore                                  # Git ignore rules
└── 📄 .dockerignore                               # Docker ignore rules
```

---

## 🔧 Backend (API)

### Технології

- **Runtime:** Node.js 18 LTS
- **Framework:** Express.js 4.18
- **Database:** MongoDB + Mongoose 8.0
- **Middleware:** CORS, Multer (file uploads)
- **Dev Tools:** Nodemon, mongodb-memory-server

### Структура моделей

#### User Model (`api/src/models/user.js`)
```javascript
{
  email: String (unique, required, валідація)
  password: String (required, hashed)
  firstName: String (required)
  lastName: String (required)
  role: String (enum: ['user', 'admin'], default: 'user')
  createdAt: Date (auto)
}
```

#### MenuItem Model (`api/src/models/menuItem.js`)
```javascript
{
  name: String (required)
  description: String
  price: Number (required)
  image: String (URL або шлях)
  category: String (ref: Category)
  weight: Number
  weightUnit: String (g, ml)
  isAvailable: Boolean (default: true)
  createdAt: Date
}
```

#### Category Model (`api/src/models/category.js`)
```javascript
{
  key: String (unique, required)
  label: String (required)
  isActive: Boolean (default: true)
}
```

#### Review Model (`api/src/models/review.js`)
```javascript
{
  name: String (required)
  rating: Number (1-5, required)
  text: String (required)
  approved: Boolean (default: false)
  createdAt: Date
}
```

### API Endpoints

| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | `/users` | Отримати всіх користувачів |
| POST | `/users` | Створити користувача |
| GET | `/users/:id` | Отримати користувача за ID |
| GET | `/menu-items` | Отримати всі страви |
| POST | `/menu-items` | Додати нову страву |
| PUT | `/menu-items/:id` | Оновити страву |
| DELETE | `/menu-items/:id` | Видалити страву |
| GET | `/categories` | Отримати всі категорії |
| POST | `/categories` | Створити категорію |
| GET | `/reviews` | Отримати всі відгуки |
| POST | `/reviews` | Додати відгук |

### NPM Scripts

```json
{
  "start": "node src/app.js",                    // Production запуск
  "dev": "nodemon src/app.js",                   // Development з auto-reload
  "dev:local": "nodemon src/app.local.js",       // Локально з in-memory MongoDB
  "prod:local": "NODE_ENV=production node src/app.local.js",
  "create:admin": "node src/createAdmin.js",     // Створення адміна
  "seed": "node src/seedData.js",                // Seed даних
  "seed:categories": "node src/seedCategories.js"
}
```

### Змінні оточення

| Змінна | Опис | Дефолт |
|--------|------|--------|
| `PORT` | Порт сервера | `3001` |
| `HOST` | Хост прив'язки | `0.0.0.0` |
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/api` |
| `NODE_ENV` | Режим роботи | `development` |

---

## ⚛️ Frontend (React)

### Технології

- **Framework:** React 18.2
- **Build Tool:** Vite 4.3.9
- **Router:** React Router DOM 6.x
- **State Management:** React Hooks (useState, useEffect)
- **HTTP Client:** Fetch API / Axios

### Компонентна структура

```
App.jsx (Root)
├── Header.jsx
├── Navigation.jsx
└── Routes
    ├── Home.jsx
    │   ├── Hero.jsx
    │   ├── MenuItemsList.jsx
    │   └── ReviewsList.jsx
    ├── Menu.jsx
    │   ├── CategoryFilter.jsx
    │   └── MenuItemsList.jsx
    ├── Orders.jsx
    │   └── OrderForm.jsx
    └── Admin.jsx
        ├── UsersList.jsx
        ├── MenuItemForm.jsx
        └── CategoryForm.jsx
```

### NPM Scripts

```json
{
  "start": "vite",                               // Dev server з HMR
  "build": "vite build",                         // Production build
  "preview": "vite preview",                     // Preview production build
  "lint": "eslint src"                          // Linting
}
```

### Vite конфігурація

```javascript
// vite.config.js
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'           // Proxy для dev
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}
```

### Змінні оточення

| Змінна | Опис | Приклад |
|--------|------|---------|
| `VITE_API_BASE` | Base URL для API | `http://localhost:3001` або `https://ztu-sushi-shop.azurewebsites.net` |

---

## 🔄 DevOps та CI/CD

### GitHub Actions Workflow

**Файл:** `.github/workflows/deploy-frontend-azure.yml`

#### Тригери
- Push в гілку `frontend`
- Manual dispatch (workflow_dispatch)

#### Jobs

**1. Build Job**
```yaml
Steps:
1. Checkout code
2. Setup Node.js 18
3. Cache npm dependencies
4. npm install (frontend)
5. npm run build (frontend)
6. Upload dist/ as artifact
```

**2. Deploy Job**
```yaml
Steps:
1. Download build artifact
2. Login to Azure (Service Principal)
3. Deploy to Azure Web App
```

### Secrets (GitHub)

| Secret | Опис |
|--------|------|
| `AZURE_CREDENTIALS` | JSON з Service Principal credentials |
| `AZURE_RESOURCE_GROUP` | Назва Resource Group (`sushi-shop-rg`) |

---

## 🐳 Docker конфігурація

### Dockerfile структура

#### API Production (`api/Dockerfile`)
```dockerfile
FROM node:20-bullseye-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

#### API Development (`api/Dockerfile.dev`)
```dockerfile
FROM node:20-bullseye-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
VOLUME ["/usr/src/app/src", "/usr/src/app/uploads"]
EXPOSE 3001
CMD ["npm", "run", "dev"]
```

#### Frontend Production (`frontend/Dockerfile.prod`)
```dockerfile
# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
```

### Docker Compose

#### Production (`docker-compose.yml`)
```yaml
services:
  api:
    container_name: api_prod
    ports: ["3001:3001"]
    environment:
      - MONGO_URL=mongodb://api_db:27017/api
  
  frontend:
    container_name: frontend_prod
    ports: ["3000:3000"]
  
  api_db:
    container_name: api_db_prod
    image: mongo:latest
    ports: ["27017:27017"]
    volumes:
      - mongodb_api:/data/db
```

#### Development (`docker-compose.dev.yml`)
```yaml
services:
  api:
    container_name: api_dev
    ports: ["3002:3001"]
    volumes:
      - ./api/src:/usr/src/app/src        # Hot reload
      - ./api/uploads:/usr/src/app/uploads
  
  frontend:
    container_name: frontend_dev
    ports: ["3003:3000"]
    volumes:
      - ./frontend:/usr/src/app           # Hot reload
      - /usr/src/app/node_modules
```

### Makefile команди

```makefile
make prod       # Запуск production (ports 3000/3001)
make dev        # Запуск development (ports 3003/3002)
make both       # Запуск обох стеків одночасно
make down       # Зупинка контейнерів
make logs-dev   # Логи development API
make logs-prod  # Логи production API
```

---

## ☁️ Azure інфраструктура

### Ресурси

| Ресурс | Тип | Опис |
|--------|-----|------|
| `sushi-shop-rg` | Resource Group | Контейнер для всіх ресурсів |
| `sushi-shop-plan` | App Service Plan | Обчислювальні ресурси (F1 Free Tier) |
| `ztu-sushi-shop` | Web App | Frontend хостинг (Node.js 20 LTS) |
| `github-sushi-shop-deploy` | Service Principal | Credentials для GitHub Actions |

### Регіони

- **Рекомендований:** West Europe (`westeurope`)
- **Альтернативи:** Canada Central, East US, North Europe

### Service Principal Permissions

```json
{
  "role": "Contributor",
  "scope": "/subscriptions/{sub-id}/resourceGroups/sushi-shop-rg"
}
```

### Скрипти деплою

**Створення ресурсів:**
```bash
./scripts/azure/10-create-resource-group-and-webapp.sh
```

**Створення Service Principal:**
```bash
./scripts/azure/11-create-service-principal.sh
```

---

## 🌐 Порти та URL

### Локальна розробка

| Сервіс | URL | Порт |
|--------|-----|------|
| Frontend Dev | http://localhost:3003 | 3003 |
| API Dev | http://localhost:3002 | 3002 |
| MongoDB | mongodb://localhost:27017 | 27017 |

### Локальна Production

| Сервіс | URL | Порт |
|--------|-----|------|
| Frontend Prod | http://localhost:3000 | 3000 |
| API Prod | http://localhost:3001 | 3001 |
| MongoDB | mongodb://localhost:27017 | 27017 |

### Azure Production

| Сервіс | URL |
|--------|-----|
| Frontend | https://ztu-sushi-shop.azurewebsites.net |
| API (якщо деплоїться) | https://ztu-sushi-shop-api.azurewebsites.net |

---

## 📊 Статистика проекту

### Розмір коду (приблизно)

```
Backend (API):
  - JavaScript: ~2000 рядків
  - Моделі: 4 файли
  - Роутери: 4 файли
  - Конфігурація: 200 рядків

Frontend:
  - JSX/JS: ~3000 рядків
  - Компоненти: 8-12 файлів
  - Сторінки: 3-5 файлів
  - Стилі (CSS): ~500 рядків

DevOps:
  - Dockerfile: 4 файли
  - Docker Compose: 3 файли
  - GitHub Actions: 1 workflow (70 рядків)
  - Bash скрипти: 2 файли (~300 рядків)

Документація:
  - Markdown: ~2000 рядків
  - README, ARCHITECTURE, CI/CD docs
```

### Dependencies

```
Backend: 6 production + 2 dev dependencies
Frontend: 4 production + 3 dev dependencies
Total npm packages: ~150 (з підзалежностями)
```

---

## 🔐 Безпека

### Секрети та credentials

- ❌ **Ніколи не комітити:** `.env`, `.env.local`, credentials
- ✅ **Використовувати:** GitHub Secrets, Azure Key Vault
- ✅ **Gitignore:** `node_modules/`, `.env*`, `dist/`, `uploads/`

### CORS конфігурація

```javascript
// api/src/app.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

## 📝 Документація

| Файл | Опис |
|------|------|
| `README.md` | Швидкий старт, огляд проекту |
| `ARCHITECTURE.md` | Детальна архітектура (цей файл) |
| `WEBAPP_API_DEPLOYMENT.md` | Деплой API на Azure |
| `frontend/FRONTEND_CI_CD_SETUP.md` | CI/CD для frontend |
| `api/ENV_LOCAL_README.md` | Змінні оточення API |

---

## 🚀 Швидкий старт

### 1. Локальна розробка

```bash
# Development mode (hot-reload)
make dev

# Production mode
make prod
```

### 2. Azure деплой

```bash
# Створити ресурси
./scripts/azure/10-create-resource-group-and-webapp.sh

# Створити Service Principal
./scripts/azure/11-create-service-principal.sh

# Додати secrets в GitHub
# Push в гілку frontend
git checkout frontend
git push origin frontend
```

---

## 🔗 Посилання

| Ресурс | URL |
|--------|-----|
| GitHub Repo | https://github.com/AlekseyOL2004/sushi_shop |
| GitHub Actions | https://github.com/AlekseyOL2004/sushi_shop/actions |
| Azure Portal | https://portal.azure.com |
| Deployed App | https://ztu-sushi-shop.azurewebsites.net |

---

**Версія документа:** 1.0  
**Останнє оновлення:** 2024  
**Автор:** AlekseyOL2004

---

🍣 **Sushi Shop — Modern Web Application with CI/CD** 🚀
