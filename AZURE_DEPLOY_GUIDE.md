# ☁️ Повна інструкція деплою в Azure з CI/CD

Ця інструкція допоможе розгорнути проект, де **Бекенд та БД** працюють в контейнерах, а **Фронтенд** як статичний сайт. Усе оновлюється автоматично при пуші в GitHub.

---

## 🏗️ Крок 0: Вибір середовища виконання

У вас є два варіанти де виконувати команди Azure CLI:

| Варіант | Переваги | Недоліки |
|---------|----------|----------|
| **Локальний термінал** (Git Bash/PowerShell) | Всі файли проекту вже є | Потрібно встановлювати Azure CLI |
| **Azure Cloud Shell** (онлайн) | Azure CLI вже встановлений | Треба завантажувати файли |

**Рекомендація:** Використовуйте **локальний термінал**, якщо Azure CLI вже встановлений.

---

## 🏗️ Крок 1: Підготовка GitHub Secrets

Для автоматизації нам потрібно надати GitHub доступ до Docker Hub та Azure.

1.  **Створіть акаунт на [Docker Hub](https://hub.docker.com/)**, якщо немає.
2.  В репозиторії GitHub перейдіть: **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
3.  Додайте такі секрети:

| Назва Secret | Значення |
|--------------|----------|
| `DOCKER_USERNAME` | Ваш логін Docker Hub (`AlekseyOL2004`) |
| `DOCKER_PASSWORD` | Ваш пароль Docker Hub (або [Access Token](https://hub.docker.com/settings/security)) |
| `AZURE_CREDENTIALS` | JSON для доступу (отримаємо в Кроці 4) |

---

## ⚙️ Крок 2: Налаштування Docker Compose для Azure

1.  Відкрийте файл `docker-compose.azure.yml` у корені проекту.
2.  **ВАЖЛИВО:** Замініть `YOUR_DOCKER_USER` на ваш реальний логін Docker Hub!

```yaml
version: '3.8'
services:
  api_db:
    image: mongo:latest
    restart: always
    volumes:
      - ${WEBAPP_STORAGE_HOME}/site/wwwroot/data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=SecurePassword123!

  api:
    image: AlekseyOL2004/sushi-api:latest  # <--- ВАШ ЛОГІН DOCKER HUB
    restart: always
    ports:
      - "80:3001"
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - MONGO_URL=mongodb://admin:SecurePassword123!@api_db:27017/sushi_shop?authSource=admin
    depends_on:
      - api_db
```

**Збережіть файл!**

---

## 🚀 Крок 3: Деплой Бекенду та БД (Azure Web App)

### Варіант A: Локальний термінал (PowerShell)

```powershell
# 1. Перейдіть у папку проекту
cd "C:\University\Магістратура 1 курс\1 семестр\Docker\coursework\Project"

# 2. Перевірте що файл існує
ls docker-compose.azure.yml

# 3. Залогіньтесь в Azure (якщо ще не залогінені)
az login

# 4. Створіть Web App для бекенду
az webapp create `
  --resource-group sushi-project-rg `
  --plan sushi-plan `
  --name ztu-sushi-backend `
  --multicontainer-config-type compose `
  --multicontainer-config-file docker-compose.azure.yml

# 5. Увімкніть збереження даних БД
az webapp config appsettings set `
  --resource-group sushi-project-rg `
  --name ztu-sushi-backend `
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=TRUE
```

### Варіант B: Azure Cloud Shell (Bash)

```bash
# 1. Завантажте файл docker-compose.azure.yml
# Натисніть кнопку "Upload/Download files" -> Upload

# 2. Перевірте що файл завантажився
ls docker-compose.azure.yml

# 3. Створіть Web App
az webapp create \
  --resource-group sushi-project-rg \
  --plan sushi-plan \
  --name ztu-sushi-backend \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose.azure.yml

# 4. Увімкніть збереження даних БД
az webapp config appsettings set \
  --resource-group sushi-project-rg \
  --name ztu-sushi-backend \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=TRUE
```

---

## 🔐 Крок 4: Створення Service Principal для GitHub Actions

Цей крок дозволяє GitHub автоматично деплоїти зміни.

```bash
# Виконайте цю команду в терміналі (локально або Cloud Shell)
az ad sp create-for-rbac \
  --name "github-actions-sushi" \
  --role contributor \
  --scopes /subscriptions/6cb6bef8-ca82-4fad-a987-01e8e74bb7e8/resourceGroups/sushi-project-rg \
  --sdk-auth
```

**ЗБЕРЕЖІТЬ ВЕСЬ JSON-ВИВІД!** Він виглядає приблизно так:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "6cb6bef8-ca82-4fad-a987-01e8e74bb7e8",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  ...
}
```

### Додайте цей JSON у GitHub:

1. Відкрийте: https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions
2. **New repository secret**
3. Name: `AZURE_CREDENTIALS`
4. Value: Вставте JSON повністю
5. **Add secret**

---

## 📝 Крок 5: Створення Workflow для автоматичного деплою бекенду

**ВАЖЛИВО:** Переконайтесь що у вас є тільки **один** workflow файл для кожного компонента!

### Структура workflow файлів

```
.
└── .github
    └── workflows
        ├── deploy-backend.yml
        └── deploy-frontend.yml
```

### Приклад вмісту `deploy-backend.yml`

```yaml
name: Build and Deploy Backend

on:
  push:
    branches: [ "main", "master", "api" ]
    paths:
      - 'api/**'
      - 'docker-compose.azure.yml'
  workflow_dispatch:

env:
  DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
  IMAGE_NAME: sushi-api
  AZURE_WEBAPP_NAME: ztu-sushi-backend
  AZURE_RESOURCE_GROUP: sushi-project-rg

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/${{ env.IMAGE_NAME }}:latest

  deploy-to-azure:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Restart Azure Web App
        run: |
          az webapp restart --name ${{ env.AZURE_WEBAPP_NAME }} --resource-group ${{ env.AZURE_RESOURCE_GROUP }}
```

---

## 🌐 Крок 6: Деплой Фронтенду (Azure App Service)

Оскільки Static Web Apps недоступні в `polandcentral`, використовуємо **Azure App Service (Linux)**.

### 1. Оновіть `frontend/.env.production`

```
VITE_API_BASE=https://ztu-sushi-backend.azurewebsites.net
```

*(Замініть `ztu-sushi-backend` на ваше ім'я Web App з Кроку 3)*

### 2. Закомітьте зміни

```bash
git add frontend/.env.production docker-compose.azure.yml .github/workflows/deploy-backend.yml
git commit -m "Configure Azure deployment"
git push
```

### 3. Створіть App Service для фронтенду

Ми вже створили бекенд в App Service, тому просто повторимо ці кроки для фронтенду.

#### Варіант A: Локальний термінал (рекомендовано)

```bash
# 1. Увійдіть в Azure (якщо ще не залогінені)
az login

# 2. Створіть Web App для фронтенду (замініть ztu-sushi-frontend на унікальне ім'я, якщо потрібно)
az webapp create  --resource-group sushi-project-rg  --plan sushi-plan --name ztu-sushi-frontend  --runtime "NODE:20-lts"  --deployment-source-url https://github.com/AlekseyOL2004/sushi_shop  --deployment-source-branch frontend  --deployment-source-repo-url https://github.com/AlekseyOL2004/sushi_shop.git  --deployment-source-access-token

az webapp create --resource-group sushi-project-rg  --plan sushi-plan  --name ztu-sushi-frontend  --runtime "NODE:20-lts"
```

#### Варіант B: Azure Cloud Shell

```bash
# 1. Створіть Web App для фронтенду
az webapp create \
  --resource-group sushi-project-rg \
  --plan sushi-plan \
  --name ztu-sushi-frontend \
  --runtime "NODE|20-lts" \
  --deployment-source-url https://github.com/AlekseyOL2004/sushi_shop \
  --deployment-source-branch frontend \
  --deployment-source-repo-url https://github.com/AlekseyOL2004/sushi_shop.git \
  --deployment-source-access-token
```

---


az webapp config set  --resource-group sushi-project-rg  --name ztu-sushi-frontend  --startup-file "npx serve -s dist -l 8080"

  az webapp config appsettings set  --resource-group sushi-project-rg  --name ztu-sushi-frontend  --settings    WEBSITE_NODE_DEFAULT_VERSION="20-lts"    SCM_DO_BUILD_DURING_DEPLOYMENT="true"


## ✅ Як працює автоматизація (CI/CD)

Після налаштування:

1.  **Бекенд (API)**:
    *   Змінюєте файли в папці `api/` → `git push`
    *   GitHub Action збирає Docker образ → пушить на Docker Hub
    *   Azure Web App перезапускається і підтягує новий образ

2.  **Фронтенд**:
    *   Змінюєте файли в папці `frontend/` → `git push`
    *   GitHub Action (створений Azure) збирає React
    *   Публікує на App Service

---

## 🎯 Швидкий чеклист

```
☐ 1. Зареєструватись на hub.docker.com
☐ 2. Замінити YOUR_DOCKER_USER в docker-compose.azure.yml
☐ 3. Додати DOCKER_USERNAME, DOCKER_PASSWORD в GitHub Secrets
☐ 4. Створити Web App (локально: az webapp create ...)
☐ 5. Створити Service Principal (az ad sp create-for-rbac ...)
☐ 6. Додати AZURE_CREDENTIALS в GitHub Secrets
☐ 7. Створити .github/workflows/deploy-backend.yml
☐ 8. Оновити frontend/.env.production
☐ 9. Створити App Service для фронтенду
☐ 10. git push і перевірити Actions
```

---

## ⚠️ Вирішення проблем

### Backend показує 503 (Service Unavailable)

**Причина:** Docker контейнер не запустився.

**Діагностика:**
```bash
# Подивіться логи
az webapp log tail --name ztu-sushi-backend --resource-group sushi-project-rg

# Перевірте чи існує Docker образ
# Відкрийте: https://hub.docker.com/r/alekseyol2004/sushi-api
```

**Рішення:**
```powershell
# 1. Зберіть образ локально
cd api
docker build -t alekseyol2004/sushi-api:latest .

# 2. Залогіньтесь в Docker Hub
docker login

# 3. Запуште образ
docker push alekseyol2004/sushi-api:latest

# 4. Перезапустіть Web App
az webapp restart --name ztu-sushi-backend --resource-group sushi-project-rg
```

### Frontend показує 404 (Not Found)

**Причина:** Файли `dist/` не завантажені на сервер.

**Рішення 1: Через GitHub Actions**
```bash
git checkout frontend
git add .github/workflows/deploy-frontend.yml
git commit -m "Deploy frontend"
git push origin frontend
```

**Рішення 2: Ручний деплой**
```powershell
cd frontend
npm run build
az webapp deploy --resource-group sushi-project-rg --name ztu-sushi-frontend --src-path dist
```

### MongoDB не підключається

**Симптом:** Логи показують "MongoServerError: Authentication failed"

**Рішення:**
Перевірте що змінна `WEBSITES_ENABLE_APP_SERVICE_STORAGE=TRUE` встановлена:
```bash
az webapp config appsettings set \
  --resource-group sushi-project-rg \
  --name ztu-sushi-backend \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=TRUE
```

### favicon.ico помилки

**Це нормально!** Браузер шукає іконку сайту. Додайте `favicon.ico` в `frontend/public/` якщо хочете позбутися помилки.

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
