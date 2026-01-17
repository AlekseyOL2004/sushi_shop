# ☁️ Повна інструкція деплою Sushi Shop в Azure з CI/CD

Ця інструкція описує **весь процес** деплою проекту Roll & Go (Sushi Shop) в Azure, включаючи налаштування MongoDB Atlas, Cloudflare Worker для HTTPS, GitHub Actions CI/CD та вирішення всіх проблем.

---

## 📋 Зміст

1. [Огляд архітектури](#огляд-архітектури)
2. [Підготовка середовища](#підготовка-середовища)
3. [Налаштування MongoDB Atlas](#налаштування-mongodb-atlas)
4. [Деплой Backend API в Azure Container Instances](#деплой-backend-api-в-azure-container-instances)
5. [Деплой Frontend в Azure App Service](#деплой-frontend-в-azure-app-service)
6. [Налаштування Cloudflare Worker для HTTPS](#налаштування-cloudflare-worker-для-https)
7. [Налаштування GitHub Actions CI/CD](#налаштування-github-actions-cicd)
8. [Вирішення проблем](#вирішення-проблем)
9. [Фінальна перевірка](#фінальна-перевірка)

---

## 🏗️ Огляд архітектури

### Фінальна архітектура проекту

![Архітектура рішення](https://i.imgur.com/your-architecture-diagram.png)

---

## 1. Підготовка проекту

### 1.1 Клонуйте репозиторій

```bash
git clone https://github.com/AlekseyOL2004/sushi_shop.git
cd sushi_shop
```

### 1.2 Встановіть залежності

```bash
# Для фронтенду
cd frontend
npm install

# Для бекенду
cd ../api
npm install
```

### 1.3 Створіть файл `.env` для бекенду

Скопіюйте файл `.env.example` в `.env` та відредагуйте значення.

```bash
cp .env.example .env
```

### 1.4 Налаштуйте MongoDB Atlas

1.  Створіть кластер на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Додайте IP адресу вашого сервера в список дозволених (Network Access).
3.  Створіть користувача бази даних з паролем.
4.  Отримайте рядок підключення (Connection String) для вашої бази даних.

### 1.5 Налаштуйте Cloudflare

1.  Зареєструйтесь на [Cloudflare](https://www.cloudflare.com/).
2.  Додайте ваш домен та налаштуйте DNS записи.
3.  Включіть SSL/TLS для вашого домену.

---

## 2. Налаштування GitHub Repository

### 2.1 Створіть новий репозиторій на GitHub

1.  Перейдіть на [GitHub](https://github.com/).
2.  Натисніть на кнопку "New" для створення нового репозиторію.
3.  Введіть ім'я репозиторію (наприклад, `sushi_shop`).
4.  Виберіть видимість (Public або Private).
5.  Натисніть "Create repository".

### 2.2 Додайте віддалений репозиторій

```bash
git remote add origin https://github.com/AlekseyOL2004/sushi_shop.git
```

### 2.3 Додайте файли та зробіть перший коміт

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 3. Налаштування Docker Hub

### 3.1 Створіть акаунт на Docker Hub

1.  Перейдіть на [Docker Hub](https://hub.docker.com/).
2.  Натисніть на кнопку "Sign Up" для створення нового акаунту.
3.  Введіть необхідну інформацію та підтвердіть реєстрацію.

### 3.2 Створіть новий репозиторій на Docker Hub

1.  Увійдіть в свій акаунт на Docker Hub.
2.  Натисніть на кнопку "Create Repository".
3.  Введіть ім'я репозиторію (наприклад, `sushi-api`).
4.  Виберіть видимість (Public або Private).
5.  Натисніть "Create".

### 3.3 Налаштуйте Docker для входу

```bash
docker login
```

Введіть ваше ім'я користувача та пароль від Docker Hub.

---

## 4. Налаштування MongoDB Atlas

### 4.1 Створіть акаунт MongoDB Atlas

1. Відкрити https://www.mongodb.com/cloud/atlas/register
2. Зареєструватись (можна через Google)
3. Створити організацію: `Sushi Shop`

---

### Крок 2: Створити кластер

1. **Create Deployment** → **Create**
2. **Cluster Tier:** M0 (Free)
3. **Cloud Provider:** AWS
4. **Region:** `eu-central-1` (Frankfurt) або найближчий регіон
5. **Cluster Name:** `Cluster0`
6. **Create Deployment**

**Дочекайтесь створення кластера (2-3 хвилини)**

---

### Крок 3: Створити Database User

1. **Database Access** (ліве меню)
2. **Add New Database User**
3. **Authentication Method:** Password
4. **Username:** `admin`
5. **Password:** `SecurePassword123` (або згенеруйте складний)
6. **Database User Privileges:** `Atlas admin`
7. **Add User**

---

### Крок 4: Налаштувати Network Access

1. **Network Access** (ліве меню)
2. **Add IP Address**
3. **Allow Access from Anywhere:** `0.0.0.0/0`
4. **Confirm**

**⚠️ Увага:** Для production рекомендується обмежити доступ тільки до Azure IP!

---

### Крок 5: Отримати Connection String

1. **Database** → **Connect**
2. **Connect your application**
3. **Driver:** Node.js
4. **Version:** 5.5 or later
5. **Copy Connection String:**

---

## 5. Налаштування Azure

### 5.1 Створіть акаунт на Azure

1.  Перейдіть на [Azure](https://azure.microsoft.com/).
2.  Натисніть на кнопку "Start free" для створення нового акаунту.
3.  Введіть необхідну інформацію та підтвердіть реєстрацію.

### 5.2 Встановіть Azure CLI

1.  Завантажте та встановіть [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
2.  Перевірте встановлення:

```bash
az --version
```

### 5.3 Увійдіть в Azure

```bash
az login
```

### 5.4 Створіть Resource Group

```bash

Central US краще використати ті які доступні користувачу
для цього є команда az policy assignment list --query "[].{Name:displayName, Params:parameters}" -o json

az group create --name sushi-project-rg --location "Central US"


```

### 5.5 Створіть App Service Plan

```bash
az appservice plan create --name sushi-plan --resource-group sushi-project-rg --sku B1 --is-linux
```

---

## 6. Деплой Backend API в Azure Container Instances

### 6.1 Створіть файл `docker-compose.azure.yml`

```yaml
version: '3'

services:
  api:
    image: knm251oos/sushi-api:latest
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - MONGO_URL=mongodb://admin:SecurePassword123@mongo:27017/sushi_shop?authSource=admin
  mongo:
    image: knm251oos/sushi-mongodb:latest
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=SecurePassword123
```

### 6.2 Деплой в Azure

```bash
az container create \
  --resource-group sushi-project-rg \
  --name sushi-backend \
  --image knm251oos/sushi-api:latest \
  --ports 3001 \
  --environment-variables \
    PORT=3001 \
    HOST=0.0.0.0 \
    MONGO_URL=mongodb://admin:SecurePassword123@mongo:27017/sushi_shop?authSource=admin \
  --cpu 1 \
  --memory 1 \
  --location polandcentral
```

### 6.3 Перевірте деплой

```bash
# Отримати IP адреси контейнерів
az container show --resource-group sushi-project-rg --name sushi-backend --query ipAddress.ip --output tsv

# Перевірити статус контейнерів
az container show --resource-group sushi-project-rg --name sushi-backend --query "containers[0].instanceView.state"

# Переглянути логи
az container logs --resource-group sushi-project-rg --name sushi-backend
```

---

## 7. Деплой Frontend в Azure App Service

### 7.1 Налаштуйте файл `frontend/.env.production`

```env
VITE_API_BASE=http://<YOUR_API_IP>:3001
```

### 7.2 Деплой в Azure

```bash
# Перейти в папку фронтенду
cd frontend

# Збілдити проект
npm run build

# Деплой на Azure
az webapp up --name ztu-sushi-frontend --resource-group sushi-project-rg --plan sushi-plan --location polandcentral --sku B1 --runtime "NODE|14-lts" --source-path ./dist
```

### 7.3 Перевірте деплой

```bash
# Отримати URL фронтенду
az webapp show --resource-group sushi-project-rg --name ztu-sushi-frontend --query defaultHostName --output tsv

# Відкрити в браузері
start https://<YOUR_FRONTEND_URL>
```

---

## 8. Налаштування Cloudflare Worker для HTTPS

### 8.1 Створіть Worker

1.  Перейдіть на [Cloudflare Workers](https://workers.cloudflare.com/).
2.  Натисніть на кнопку "Create a Worker".
3.  Введіть назву для вашого Worker (наприклад, `sushi-shop-https`).
4.  Виберіть ваш домен.

### 8.2 Налаштуйте Worker

Вставте наступний код в редакторі Cloudflare Worker:

```javascript
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  url.hostname = "your-backend-api.azurecontainer.io"
  return fetch(url, request)
}
```

### 8.3 Збережіть та активуйте Worker

1.  Натисніть на кнопку "Save and Deploy".
2.  Перевірте статус активації.

---

## 9. Налаштування GitHub Actions CI/CD

### 9.1 Створіть файл `.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main
      - frontend
    paths:
      - 'api/**'
      - 'mongodb/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Log in to Docker Hub
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push MongoDB image
      uses: docker/build-push-action@v2
      with:
        context: ./mongodb
        push: true
        tags: knm251oos/sushi-mongodb:latest

    - name: Build and push API image
      uses: docker/build-push-action@v2
      with:
        context: ./api
        push: true
        tags: knm251oos/sushi-api:latest

    - name: Deploy to Azure Container Instances
      uses: azure/aci-deploy@v1
      with:
        resource-group: sushi-project-rg
        name: sushi-backend
        image: knm251oos/sushi-api:latest
        cpu: 1
        memory: 1
        ports: 3001
        environment-variables: |
          PORT=3001
          HOST=0.0.0.0
          MONGO_URL=mongodb://admin:SecurePassword123@mongo:27017/sushi_shop?authSource=admin
```

### 9.2 Створіть файл `.github/workflows/deploy-frontend.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
      - frontend
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Build frontend
      run: |
        cd frontend
        npm install
        npm run build

    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: ztu-sushi-frontend
        slot-name: production
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./frontend/dist
```

### 9.3 Налаштуйте Secrets в GitHub

1.  Перейдіть в налаштування вашого репозиторію на GitHub.
2.  Виберіть "Secrets and variables" -> "Actions".
3.  Додайте наступні секрети:
    - `DOCKER_USERNAME`: Ваш логін Docker Hub.
    - `DOCKER_PASSWORD`: Ваш пароль Docker Hub.
    - `AZURE_WEBAPP_PUBLISH_PROFILE`: Профіль публікації вашого Azure App Service.

---

## 10. Тестування та перевірка

### 10.1 Перевірте статус GitHub Actions

1.  Перейдіть на вкладку "Actions" вашого репозиторію на GitHub.
2.  Виберіть останній запуск workflow.
3.  Перевірте логи на наявність помилок.

### 10.2 Перевірте доступність додатку

1.  Відкрийте браузер.
2.  Перейдіть за адресою вашого домену (наприклад, `https://yourdomain.com`).
3.  Перевірте, чи завантажується ваш додаток.

---

## 11. Вирішення проблем

### 11.1 Загальні проблеми

- **Проблема:** Додаток не завантажується.
  - **Рішення:** Перевірте логи в GitHub Actions та Azure. Переконайтесь, що всі сервіси запущені.

- **Проблема:** Помилка підключення до бази даних.
  - **Рішення:** Перевірте рядок підключення до MongoDB. Переконайтесь, що IP адреса вашого сервера додана в список дозволених в MongoDB Atlas.

### 11.2 Специфічні проблеми

- **Проблема:** Azure Web App не стартує.
  - **Рішення:** Перевірте налаштування App Service. Переконайтесь, що вказані правильні порти та образи контейнерів.

- **Проблема:** Cloudflare Worker не працює.
  - **Рішення:** Перевірте налаштування Worker. Переконайтесь, що вказано правильне ім'я хоста для вашого API.

---

## 🔗 Корисні посилання

| Ресурс | URL |
|--------|-----|
| GitHub Repository | https://github.com/AlekseyOL2004/sushi_shop |
| GitHub Actions | https://github.com/AlekseyOL2004/sushi_shop/actions |
| GitHub Secrets | https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions |
| Azure Portal | https://portal.azure.com |
| Docker Hub | https://hub.docker.com/u/AlekseyOL2004 |

---

**Успішного деплою! 🚀**