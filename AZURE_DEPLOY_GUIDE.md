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

## 🔧 Крок 2: Підготовка Azure

### 2.1 Встановити Azure CLI (якщо ще не встановлений)

Інструкції: https://docs.microsoft.com/uk-ua/cli/azure/install-azure-cli

### 2.2 Увійти в Azure

```powershell
az login
```

### 2.2.1 Зареєструвати необхідні провайдери (ВАЖЛИВО!)

Перед створенням ресурсів потрібно зареєструвати провайдери Azure:

```powershell
# Зареєструвати провайдери
az provider register --namespace Microsoft.ContainerInstance
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Network
az provider register --namespace Microsoft.Storage

# Дочекатись завершення реєстрації (2-5 хвилин)
az provider show --namespace Microsoft.ContainerInstance --query "registrationState"
```

Дочекайтесь поки статус зміниться на `"Registered"` перед продовженням!

**Перевірка всіх провайдерів:**

```powershell
az provider list --query "[?namespace=='Microsoft.ContainerInstance' || namespace=='Microsoft.Web' || namespace=='Microsoft.Network'].{Provider:namespace, Status:registrationState}" --output table
```

Всі мають бути `Registered`.

### 2.3 Створити Resource Group

```powershell
az group create --name sushi-project-rg --location "Central US"
```

### 2.4 Створити App Service Plan

```powershell
az appservice plan create --name sushi-plan --resource-group sushi-project-rg --sku B1 --is-linux
```

---

## 📂 Крок 3: Підготувати файли проекту

### 3.1 Створити Dockerfile для MongoDB

Створіть папку `mongodb` та файл `Dockerfile`:

```bash
mkdir mongodb
```

#### mongodb/Dockerfile

```dockerfile
FROM mongo:latest

ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=SecurePassword123

EXPOSE 27017

CMD ["mongod", "--bind_ip_all"]
```

### 3.2 Збілдити та запушити Docker образи

**⚠️ ВАЖЛИВО:** Перед створенням Azure контейнерів потрібно запушити образи на Docker Hub!

```powershell
# Перейти в папку проекту
cd "C:\University\Магістратура 1 курс\1 семестр\Docker\coursework\Project"

# Залогінитись в Docker Hub
docker logout
docker login
# Username: knm251oos
# Password: (ваш пароль або Access Token)

# Збілдити MongoDB образ
docker build -t knm251oos/sushi-mongodb:latest ./mongodb

# Запушити MongoDB образ
docker push knm251oos/sushi-mongodb:latest

# Збілдити API образ
docker build -t knm251oos/sushi-api:latest ./api

# Запушити API образ
docker push knm251oos/sushi-api:latest
```

**Перевірка:** Відкрийте https://hub.docker.com/u/knm251oos і переконайтесь що обидва образи з'явились.

**Якщо помилка "push access denied":**

1. Створіть Access Token: https://hub.docker.com/settings/security
2. Залогіньтесь з токеном: `docker login -u knm251oos` (пароль = токен)
3. Повторіть push

---

## 🏗️ Крок 4: Деплой Бекенду та БД (Azure Web App)

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

## 🔐 Крок 5: Створення Service Principal для GitHub Actions

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

## 📝 Крок 6: Оновити AZURE_DEPLOY_GUIDE.md

### AZURE_DEPLOY_GUIDE.md

---

## ✅ Крок 7: Створити API контейнер з MongoDB Atlas

**✅ ВИКОНАНО!** API контейнер запущений та підключений до MongoDB Atlas.

### Перевірка

```powershell
# Health check
curl http://ztu-sushi-api.polandcentral.azurecontainer.io:3001/health

# Очікуваний результат
# {"status":"OK","mongodb":"Connected","timestamp":"..."}

# Переглянути логи
az container logs --resource-group sushi-project-rg --name sushi-api
```

### Деталі деплою

| Параметр | Значення |
|----------|----------|
| **Container Name** | `sushi-api` |
| **Image** | `knm251oos/sushi-api:latest` |
| **FQDN** | `ztu-sushi-api.polandcentral.azurecontainer.io` |
| **Public IP** | `134.112.8.175` |
| **Port** | `3001` |
| **MongoDB** | MongoDB Atlas (Cloud) |
| **CPU** | 1 core |
| **Memory** | 1 GB |

---

## ⚠️ Важливе обмеження Azure Container Instances

**Не можна використовувати VNet разом з публічним IP адресою!**

Ми використовуємо **Варіант A: Без VNet** (простіше, для навчання).

## ✅ Деплой MongoDB та API (БЕЗ VNet)

### Крок 1: Створити MongoDB

```powershell
az container create `
  --resource-group sushi-project-rg `
  --name sushi-mongodb `
  --image knm251oos/sushi-mongodb:latest `
  --ip-address Public `
  --ports 27017 `
  --os-type Linux `
  --environment-variables `
    MONGO_INITDB_ROOT_USERNAME=admin `
    MONGO_INITDB_ROOT_PASSWORD=SecurePassword123 `
  --cpu 1 `
  --memory 1.5 `
  --location polandcentral
```

**⚠️ ВАЖЛИВО:** MongoDB буде доступна через публічний IP. Для production рекомендується використовувати VNet + Application Gateway.

### Крок 2: Отримати IP MongoDB

```powershell
$MONGO_IP = az container show `
  --resource-group sushi-project-rg `
  --name sushi-mongodb `
  --query ipAddress.ip `
  --output tsv

echo "MongoDB IP: $MONGO_IP"
```

### Крок 3: Створити API

```powershell
az container create `
  --resource-group sushi-project-rg `
  --name sushi-api `
  --image knm251oos/sushi-api:latest `
  --dns-name-label ztu-sushi-api `
  --ports 3001 `
  --os-type Linux `
  --environment-variables `
    PORT=3001 `
    HOST=0.0.0.0 `
    "MONGO_URL=mongodb://admin:SecurePassword123@$MONGO_IP:27017/sushi_shop?authSource=admin" `
  --cpu 1 `
  --memory 1 `
  --location polandcentral
```

### Крок 4: Перевірити деплой

```powershell
# Отримати FQDN API
az container show `
  --resource-group sushi-project-rg `
  --name sushi-api `
  --query ipAddress.fqdn `
  --output tsv

# Перевірити health
curl http://ztu-sushi-api.polandcentral.azurecontainer.io:3001/health

# Переглянути логи
az container logs `
  --resource-group sushi-project-rg `
  --name sushi-api
```

### Крок 5: Оновити frontend/.env.production

```env
VITE_API_BASE=http://ztu-sushi-api.polandcentral.azurecontainer.io:3001
```

## 📊 Архітектура рішення

---

## 🔄 Автоматичний деплой (CI/CD)

### Тригери workflows

1. **Backend + MongoDB** (`.github/workflows/deploy-backend.yml`):
   - Тригериться при push в гілки `main` або `frontend`
   - Якщо змінилися файли в `api/**` або `mongodb/**`
   - Білдить обидва Docker образи (API та MongoDB)
   - Деплоїть в Azure Container Instances

2. **Frontend** (`.github/workflows/deploy-frontend.yml`):
   - Тригериться при push в гілки `main` або `frontend`
   - Якщо змінилися файли в `frontend/**`
   - Автоматично отримує URL API з Azure
   - Білдить React додаток з правильним `VITE_API_BASE`
   - Деплоїть на Azure App Service

### Приклад робочого процесу

```bash
# 1. Зробити зміни в гілці frontend
git checkout frontend

# 2. Змінити файли (наприклад, frontend/src або api/src)
# Змінити і frontend, і backend одночасно — все оновиться!

git add .
git commit -m "Update frontend and backend"
git push origin frontend

# 3. GitHub Actions автоматично:
#    ✅ Зібере MongoDB образ → push на Docker Hub
#    ✅ Зібере API образ → push на Docker Hub
#    ✅ Оновить MongoDB в Azure Container Instances
#    ✅ Оновить API в Azure Container Instances
#    ✅ Зібере Frontend з актуальним API URL
#    ✅ Задеплоїть Frontенд на Azure App Service

# 4. Перевірити статус:
# https://github.com/AlekseyOL2004/sushi_shop/actions
```

### Переваги цього підходу

- ✅ **Один push** — оновлює все (MongoDB, API, Frontend)
- ✅ **Автоматичне отримання API URL** для frontend
- ✅ **Ізольовані контейнери** в Azure Container Instances
- ✅ **Приватна мережа** (VNet) для MongoDB та API
- ✅ **Публічний доступ** тільки до API (через FQDN)

## ✅ Як працює автоматизація (CI/CD)

Після налаштування:

1.  **Бекенд (API)**:
    *   Змінюєте файли в папці `api/` → `git push origin main`
    *   GitHub Action збирає Docker образ → пушить на Docker Hub
    *   Azure Web App перезапускається і підтягує новий образ

2.  **Фронтенд**:
    *   Змінюєте файли в папці `frontend/` → `git push origin main`
    *   GitHub Action збирає React → створює `deploy/` з `dist/` + `package.json`
    *   Завантажує на Azure App Service

**⚠️ ВАЖЛИВО:** Workflow тригеряться **тільки з гілки `main`**!

### Робочий процес (workflow):

```bash
# 1. Робите зміни в гілці frontend
git checkout frontend
# ... робите зміни ...
git add .
git commit -m "Update features"
git push origin frontend

# 2. Зливаєте зміни в main
git checkout main
git merge frontend
git push origin main  # <--- ТУТ тригеряться workflow!

# 3. Перевіряєте статус деплою
# https://github.com/AlekseyOL2004/sushi_shop/actions
```

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
# Подивіться логи (правильна команда!)
az webapp log tail --name ztu-sushi-backend --resource-group sushi-project-rg

# Перевірте app settings
az webapp config appsettings list --name ztu-sushi-backend --resource-group sushi-project-rg

# Перевірте статус Web App
az webapp show --name ztu-sushi-backend --resource-group sushi-project-rg --query state

# Перевірте чи існує Docker образ
# Відкрийте: https://hub.docker.com/r/knm251oos/sushi-api
```

Я не хочу використовувати поки Azure Cosmos DB зроби так щоб у мене бекенд запрацював, будь ласка 

az webapp create  --resource-group sushi-project-rg  --plan sushi-plan  --name ztu-sushi-backend  --multicontainer-config-type compose  --multicontainer-config-file docker-compose.azure.yml

az webapp config.appsettings set  --name ztu-sushi-backend  --resource-group sushi-project-rg  --settings WEBSITES_PORT=80

az webapp config.container set  --name ztu-sushi-backend  --resource-group sushi-project-rg  --multicontainer-config-type compose  --multicontainer-config-file docker-compose.azure.yml

az webapp config.appsettings set  --name ztu-sushi-backend  --resource-group sushi-project-rg  --settings WEBSITES_PORT=3001

az network vnet create  --resource-group sushi-project-rg  --name sushi-vnet  --address-prefix 10.0.0.0/16  --subnet-name default  --subnet-prefix 10.0.0.0/24

az webapp restart  --name ztu-sushi-backend  --resource-group sushi-project-rg

az ad sp create-for-rbac  --name "github-actions-sushi"  --role contributor  --scopes /subscriptions/6cb6bef8-ca82-4fad-a987-01e8e74bb7e8/resourceGroups/sushi-project-rg  --sdk-auth

az container create  --resource-group sushi-project-rg  --name sushi-mongodb  --image knm251oos/sushi-mongodb:latest  --vnet sushi-vnet  --subnet default  --ip-address Private  --ports 27017  --environment-variables    MONGO_INITDB_ROOT_USERNAME=admin    MONGO_INITDB_ROOT_PASSWORD=SecurePassword123  --cpu 1  --memory 1.5  --location polandcentral


# Створити API БЕЗ VNet, але з публічним IP
az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --ip-address Public  --dns-name-label ztu-sushi-api  --ports 3001  --os-type Linux  --environment-variables    PORT=3001    HOST=0.0.0.0    "MONGO_URL=mongodb://admin:SecurePassword123@10.0.0.4:27017/sushi_shop?authSource=admin"  --cpu 1  --memory 1  --location polandcentral



**Рішення:**
```powershell
# 1. Переконайтесь що Docker образ існує
start https://hub.docker.com/r/knm251oos/sushi-api

# 2. Оновіть Docker Compose конфігурацію
az webapp config container set `
  --name ztu-sushi-backend `
  --resource-group sushi-project-rg `
  --multicontainer-config-type compose `
  --multicontainer-config-file docker-compose.azure.yml

# 3. Увімкніть збереження даних
az webapp config appsettings set `
  --name ztu-sushi-backend `
  --resource-group sushi-project-rg `
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true

# 4. Перезапустіть Web App
az webapp restart --name ztu-sushi-backend --resource-group sushi-project-rg

# 5. Дочекайтесь 2-3 хвилини і перевірте логи
az webapp log tail --name ztu-sushi-backend --resource-group sushi-project-rg
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


az container create  --resource-group sushi-project-rg  --name sushi-mongodb  --image knm251oos/sushi-mongodb:latest  --vnet sushi-vnet  --subnet default  --ip-address Private  --ports 27017  --os-type Linux  --environment-variables    MONGO_INITDB_ROOT_USERNAME=admin    MONGO_INITDB_ROOT_PASSWORD=SecurePassword123  --cpu 1  --memory 1.5  --location polandcentral

az container show  --resource-group sushi-project-rg  --name sushi-mongodb  --query instanceView.state

az container logs  --resource-group sushi-project-rg  --name sushi-mongodb  --tail 50

$MONGO_IP = az container show  --resource-group sushi-project-rg  --name sushi-mongodb  --query ipAddress.ip  --output tsv

az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --vnet sushi-vnet  --subnet default  --dns-name-label ztu-sushi-api  --ports 3001  --os-type Linux  --environment-variables    PORT=3001    HOST=0.0.0.0    "MONGO_URL=mongodb://admin:SecurePassword123@$MONGO_IP:27017/sushi_shop?authSource=admin"  --cpu 1  --memory 1  --location polandcentral


az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --vnet sushi-vnet  --subnet default  --ip-address Public  --ports 3001  --os-type Linux  --environment-variables    PORT=3001    HOST=0.0.0.0    "MONGO_URL=mongodb://admin:SecurePassword123@10.0.0.4:27017/sushi_shop?authSource=admin"  --cpu 1  --memory 1  --location polandcentral



























































**Для навчання рекомендуємо Варіант A.**MongoDB та API в приватній мережі, потрібен Application Gateway для доступу ззовні (не розглядається в цій інструкції).### Варіант B: З VNet (безпечніше, складніше)```  --location polandcentral  --memory 1 `  --cpu 1 `    "MONGO_URL=mongodb://admin:SecurePassword123@$MONGO_IP:27017/sushi_shop?authSource=admin" `    HOST=0.0.0.0 `    PORT=3001 `  --environment-variables `  --os-type Linux `  --ports 3001 `  --dns-name-label ztu-sushi-api `  --image knm251oos/sushi-api:latest `  --name sushi-api `  --resource-group sushi-project-rg `az container create `# 3. Створити API БЕЗ VNetecho "MongoDB IP: $MONGO_IP"  --output tsv  --query ipAddress.ip `  --name sushi-mongodb `  --resource-group sushi-project-rg `$MONGO_IP = az container show `# 2. Отримати IP MongoDB  --location polandcentral  --memory 1.5 `  --cpu 1 `    MONGO_INITDB_ROOT_PASSWORD=SecurePassword123 `    MONGO_INITDB_ROOT_USERNAME=admin `  --environment-variables `  --os-type Linux `  --ports 27017 `  --ip-address Public `  --image knm251oos/sushi-mongodb:latest `  --name sushi-mongodb `  --resource-group sushi-project-rg `az container create `# 1. Створити MongoDB БЕЗ VNet```powershellMongoDB та API в публічному інтернеті:### Варіант A: Без VNet (простіше, для навчання)Є два підходи:**Не можна використовувати VNet разом з публічним IP адресою!**## ⚠️ Важливе обмеження Azure Container Instances


az container logs  --resource-group sushi-project-rg  --name sushi-api

az container show  --resource-group sushi-project-rg  --name sushi-api  --query "{State:instanceView.state, RestartCount:containers[0].instanceView.restartCount, Events:instanceView.events}"  --output json

az container delete  --resource-group sushi-project-rg  --name sushi-api  --yes

$MONGO_IP = az container show  --resource-group sushi-project-rg  --name sushi-mongodb  --query ipAddress.ip  --output tsv

az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --dns-name-label ztu-sushi-api  --ports 3001  --os-type Linux  --environment-variables    PORT=3001    HOST=0.0.0.0    NODE_ENV=production    "MONGO_URL=mongodb://admin:SecurePassword123@$MONGO_IP:27017/sushi_shop?authSource=admin"  --cpu 1  --memory 1  --location polandcentral

az container delete  --resource-group sushi-project-rg  --name sushi-api  --yes

$MONGO_IP = az container show  --resource-group sushi-project-rg  --name sushi-mongodb  --query ipAddress.ip  --output tsv


az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --dns-name-label ztu-sushi-api  --ports 3001  --os-type Linux  --environment-variables    PORT=3001    HOST=0.0.0.0    NODE_ENV=production    'MONGO_URL=mongodb+srv://admin:SecurePassword123@cluster0.aepmndb.mongodb.net/sushi_shop?retryWrites=true&w=majority'  --cpu 1  --memory 1  --location polandcentral

az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --dns-name-label ztu-sushi-api  --ports 3001  --os-type Linux  --environment-variables    PORT=3001    HOST=0.0.0.0    NODE_ENV=production    "MONGO_URL=mongodb+srv://admin:SecurePassword123@cluster0.aepmndb.mongodb.net/sushi_shop?retryWrites=true&w=majority"  --cpu 1  --memory 1  --location polandcentral


az container create  --resource-group sushi-project-rg  --name sushi-api  --image knm251oos/sushi-api:latest  --dns-name-label ztu-sushi-api  --ports 3001  --os-type Linux  --cpu 1  --memory 1  --location polandcentral  --environment-variables    PORT=3001    HOST=0.0.0.0    NODE_ENV=production    MONGO_URL='mongodb+srv://admin:SecurePassword123@cluster0.aepmndb.mongodb.net/sushi_shop?retryWrites=true&w=majority'


# Налаштувати startup command
az webapp config set  --resource-group sushi-project-rg  --name ztu-sushi-frontend  --startup-file "node server.js"

# Налаштувати порт
az webapp config appsettings set  --resource-group sushi-project-rg  --name ztu-sushi-frontend  --settings WEBSITES_PORT=8080

# Перезапустити
az webapp restart  --resource-group sushi-project-rg  --name ztu-sushi-frontend