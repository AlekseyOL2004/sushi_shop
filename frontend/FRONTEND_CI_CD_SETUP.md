# 🚀 CI/CD Налаштування для Frontend → Azure Web App

Цей документ описує налаштування автоматичного деплою frontend-застосунку **Sushi Shop** до Azure Web App `ztu-sushi-shop` при кожному push в гілку `frontend`.

## 📋 Зміст

1. [Огляд процесу](#огляд-процесу)
2. [Передумови](#передумови)
3. [Налаштування Azure](#налаштування-azure)
4. [Налаштування GitHub Secrets](#налаштування-github-secrets)
5. [Перевірка статусу деплою](#перевірка-статусуу-деплою)
6. [Поширені проблеми](#поширені-проблеми)

---

## 🔄 Огляд процесу

```
┌──────────────────┐      ┌────────────────┐      ┌──────────────────────┐
│   Push в гілку   │ ───▶ │  GitHub Actions │ ───▶ │  Azure Web App       │
│   "frontend"     │      │  Build & Deploy │      │  ztu-sushi-shop      │
└──────────────────┘      └────────────────┘      └──────────────────────┘
                                │
                                ▼
                     ┌───────────────────┐
                     │  Статус workflow  │
                     │  ✅ Success       │
                     │  ❌ Failed        │
                     └───────────────────┘
```

### Workflow складається з двох jobs

| Job        | Опис                                          |
| ---------- | --------------------------------------------- |
| **build**  | Встановлює залежності, будує React застосунок |
| **deploy** | Авторизується в Azure і деплоїть зібраний код |

---

## ✅ Передумови

Перед початком налаштування переконайтеся, що у вас є:

- [ ] Azure підписка з активним акаунтом
- [ ] Права адміністратора на GitHub репозиторій
- [ ] **Azure CLI встановлено локально** (інструкція нижче)
- [ ] Git Bash або WSL (для запуску bash-скриптів)

### 📦 Встановлення Azure CLI

#### Windows:

**Спосіб 1: MSI інсталятор (рекомендовано)**

1. Завантажте: https://aka.ms/installazurecliwindows
2. Запустіть інсталятор
3. Перезапустіть термінал

**Спосіб 2: Через winget**

```powershell
# У PowerShell або CMD
winget install -e --id Microsoft.AzureCLI
```

**Спосіб 3: Через PowerShell**

```powershell
# У PowerShell (запустіть як адміністратор)
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'
```

#### Перевірка встановлення:

```bash
# У Git Bash або PowerShell
az --version
az login
```

#### Якщо Azure CLI не працює в Git Bash:

**Рішення 1: Використайте PowerShell**

```powershell
# Відкрийте PowerShell і перейдіть до проекту
cd "C:\University\Магістратура 1 курс\1 семестр\Docker\coursework\Project"

# Перевірте Azure CLI
az --version

# Якщо команда не знайдена:
# 1. Закрийте PowerShell повністю
# 2. Відкрийте знову
# 3. Або перезавантажте комп'ютер

# Запустіть скрипти через PowerShell
bash ./scripts/azure/10-create-resource-group-and-webapp.sh
bash ./scripts/azure/11-create-service-principal.sh
```

**⚠️ Якщо PowerShell не бачить команду `az` після встановлення:**

Опція А: Перезапустіть PowerShell або перезавантажте комп'ютер

Опція Б: Використайте Azure Cloud Shell замість локального встановлення

**Рішення 2: Використайте Azure Cloud Shell** (онлайн термінал, найнадійніше):
1. Відкрийте https://shell.azure.com
2. Виберіть **Bash**
3. Там Azure CLI вже встановлений і готовий до використання
4. Виконайте команди зі скриптів вручну

**Рішення 3: Створіть ресурси через Azure Portal** (веб-інтерфейс):
1. Відкрийте https://portal.azure.com
2. Створіть Resource Group вручну
3. Створіть Web App вручну
4. Для Service Principal все одно використайте Azure Cloud Shell

---

## 🔧 Налаштування Azure

### Крок 1: Створіть ресурсну групу та Web App

> **Важливо:** Всі сервіси (API, Frontend, база даних) мають бути створені в межах однієї ресурсної групи, наприклад `sushi-shop-rg`.

#### Автоматично через bash-скрипт (рекомендовано)

```bash
# Перед запуском скриптів переконайтеся, що вони мають права на виконання
chmod +x ./scripts/azure/*.sh

# Створити ресурсну групу та Web App з дефолтними значеннями
./scripts/azure/10-create-resource-group-and-webapp.sh

# АБО з власними параметрами:
./scripts/azure/10-create-resource-group-and-webapp.sh sushi-shop-rg northeurope ztu-sushi-shop sushi-shop-plan
```

**Дефолтні значення:**
- Resource Group: `sushi-shop-rg`
- Location: `westeurope` _(змінено з `northeurope` через Azure Policy обмеження для App Service Plan)_
- Web App Name: `ztu-sushi-shop`
- App Service Plan: `sushi-shop-plan`

> 💡 **Примітка:** Скрипт автоматично перевіряє чи існують ресурси перед створенням, тому його безпечно запускати кілька разів.

#### Вручну через Azure CLI

```bash
# Створити ресурсну групу (можна в northeurope)
az group create --name sushi-shop-rg --location westeurope

# Створити App Service Plan (ОБОВ'ЯЗКОВО в дозволеному регіоні!)
az appservice plan create  --name sushi-shop-plan  --resource-group sushi-shop-rg  --location westeurope  --sku F1  --is-linux

# Створити Web App для frontend
az webapp create \
  --name ztu-sushi-shop \
  --resource-group sushi-shop-rg \
  --plan sushi-shop-plan \
  --runtime "node|20-lts"
```

---

### Крок 2: Створіть Service Principal

Service Principal дозволяє GitHub Actions авторизуватися в Azure.

#### Автоматично через bash-скрипт (рекомендовано)

```bash
# Створити Service Principal з дефолтними значеннями
./scripts/azure/11-create-service-principal.sh
```

**Дефолтні значення:**
- Resource Group: `sushi-shop-rg`
- Service Principal Name: `github-sushi-shop-deploy`

**Після виконання скрипта:**
1. Скопіюйте JSON credentials з виводу терміналу
2. Збережіть їх для наступного кроку (додавання в GitHub Secrets)

#### Вручну через Azure CLI

```bash
# Отримати ID підписки
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Створити Service Principal
az ad sp create-for-rbac \
  --name "github-sushi-shop-deploy" \
  --role "Contributor" \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/sushi-shop-rg" \
  --sdk-auth
```

> ⚠️ **Важливо:** Збережіть весь JSON-вивід — він знадобиться для GitHub secret!

---

### 🔎 Як переглянути існуючий Service Principal

#### Через Azure Portal

1. Відкрийте [Azure Portal](https://portal.azure.com)
2. Перейдіть у розділ **Azure Active Directory**
3. Виберіть **App registrations** → **All applications**
4. Знайдіть `github-sushi-shop-deploy`

#### Через Azure CLI

```bash
# Переглянути Service Principal за іменем
az ad sp list --display-name "github-sushi-shop-deploy" --output table

# Отримати App ID (clientId)
az ad sp list --display-name "github-sushi-shop-deploy" --query "[0].appId" --output tsv
```

#### Скинути credentials (якщо загубили)

```bash
# Замініть <APP_ID> на фактичний clientId
az ad sp credential reset --id <APP_ID> --output json
```

#### 🗑️ Видалення Service Principal (опціонально)

Якщо потрібно видалити та створити новий Service Principal:

```bash
# Отримати App ID
APP_ID=$(az ad sp list --display-name "github-sushi-shop-deploy" --query "[0].appId" --output tsv)

# Видалити Service Principal
az ad sp delete --id $APP_ID

# Створити новий
./scripts/azure/11-create-service-principal.sh
```

> ⚠️ **Примітка:** Якщо виникає помилка `InteractionRequired` — виконайте повторний вхід:
> ```bash
> az login && az account set --subscription "<your-subscription-id>"
> ```

---

## 🔐 Налаштування GitHub Secrets

### Крок 1: Відкрийте налаштування репозиторію

1. Перейдіть: https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions
2. Натисніть **New repository secret**

### Крок 2: Додайте AZURE_CREDENTIALS

| Поле       | Значення                                            |
| ---------- | --------------------------------------------------- |
| **Name**   | `AZURE_CREDENTIALS`                                 |
| **Secret** | Весь JSON-вивід з кроку створення Service Principal |

**Приклад значення:**

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Крок 3: Додайте AZURE_RESOURCE_GROUP

| Поле       | Значення          |
| ---------- | ----------------- |
| **Name**   | `AZURE_RESOURCE_GROUP` |
| **Secret** | `sushi-shop-rg`   |

### Схема налаштування

```
GitHub Repository (AlekseyOL2004/sushi_shop)
    │
    └── Settings
            │
            └── Secrets and variables
                    │
                    └── Actions
                            │
                            └── Repository secrets
                                    │
                                    ├── AZURE_CREDENTIALS ← JSON credentials
                                    └── AZURE_RESOURCE_GROUP ← sushi-shop-rg
```

---

## 📊 Перевірка статусу деплою

### Спосіб 1: GitHub Actions Tab

1. Перейдіть: https://github.com/AlekseyOL2004/sushi_shop/actions
2. Знайдіть workflow **"Deploy Frontend to Azure Web App"**
3. Перегляньте статус:
   - ✅ Зелена галочка — успішний деплой
   - ❌ Червоний хрестик — помилка
   - 🟡 Жовте коло — в процесі

### Спосіб 2: Badge в README

Додайте badge у ваш README.md для відображення статусу:

```markdown
![Deploy Frontend](https://github.com/AlekseyOL2004/sushi_shop/actions/workflows/deploy-frontend-azure.yml/badge.svg?branch=frontend)
```

**Результат:**
![Deploy Frontend](https://github.com/AlekseyOL2004/sushi_shop/actions/workflows/deploy-frontend-azure.yml/badge.svg?branch=frontend)

### Спосіб 3: Email сповіщення

GitHub автоматично надсилає email сповіщення при помилках workflow.

**Налаштування:** GitHub Profile → Settings → Notifications

### Спосіб 4: Azure Portal

1. Відкрийте [Azure Portal](https://portal.azure.com)
2. Знайдіть Web App `ztu-sushi-shop`
3. Перегляньте **Deployment Center** для історії деплоїв

### Спосіб 5: Перевірка URL деплою

Після успішного деплою ваш frontend буде доступний за адресою:

🌐 **https://ztu-sushi-shop.azurewebsites.net**

---

## 🔍 Перегляд логів Workflow

Для детального аналізу виконання:

1. Відкрийте **Actions** → виберіть конкретний run
2. Натисніть на job (**Build Frontend** або **Deploy to Azure**)
3. Розгорніть кроки для перегляду логів

```
Workflow Run
    │
    ├── Build Frontend
    │     ├── Checkout code
    │     ├── Setup Node.js
    │     ├── Cache npm dependencies
    │     ├── Install dependencies
    │     ├── Build application
    │     └── Upload build artifact
    │
    └── Deploy to Azure
          ├── Download build artifact
          ├── Login to Azure
          └── Deploy to Azure Web App
```

---

## ⚠️ Поширені проблеми

### Проблема 1: "Login failed" при deploy

**Причина:** Неправильні Azure credentials

**Рішення:**

1. Перевірте що `AZURE_CREDENTIALS` secret містить коректний JSON
2. Перевірте що Service Principal має права на Web App
3. Скиньте credentials:

```bash
az ad sp credential reset --id <APP_ID> --output json
```

### Проблема 2: "Web App not found"

**Причина:** Web App не існує або неправильна назва

**Рішення:**

```bash
# Перевірте існування Web App
az webapp show --name ztu-sushi-shop --resource-group sushi-shop-rg

# Якщо не існує — створіть
./scripts/azure/10-create-resource-group-and-webapp.sh
```

### Проблема 3: Build failed

**Причина:** Помилки в коді React або залежностях

**Рішення:**

```bash
# Перевірте локально
cd frontend
npm install
npm run build

# Перевірте логи в GitHub Actions
```

### Проблема 4: VITE_API_BASE не підтягується

**Причина:** Неправильне значення змінної оточення при build

**Рішення:**

Перевірте в `.github/workflows/deploy-frontend-azure.yml`:

```yaml
- name: Build application
  run: npm run build
  working-directory: frontend
  env:
    VITE_API_BASE: https://ztu-sushi-shop.azurewebsites.net  # ← Має бути правильний URL
```

### Проблема 5: Azure Policy блокує регіон

**Причина:** Студентська підписка обмежує регіони для певних типів ресурсів (особливо App Service Plan)

**Важливо розуміти:**
- ✅ Resource Group можна створити в `northeurope`
- ❌ App Service Plan **НЕ МОЖНА** створити в `northeurope` (блокується політикою)

**Рішення:**

1️⃣ Перевірте дозволені регіони:
```bash
az appservice list-locations --sku F1 --linux-workers-enabled --output table
```

2️⃣ Використайте дозволений регіон (наприклад `westeurope`):
```bash
az appservice plan create \
  --name sushi-shop-plan \
  --resource-group sushi-shop-rg \
  --location westeurope \
  --sku F1 \
  --is-linux
```

3️⃣ Resource Group може залишатись в `northeurope` — це не проблема!

---

## 📁 Структура файлів проекту

```
sushi_shop/
├── .github/
│   └── workflows/
│       └── deploy-frontend-azure.yml   ← GitHub Actions workflow
├── frontend/
│   ├── package.json                    ← Залежності
│   ├── src/                            ← Вихідний код React
│   └── dist/                           ← Зібраний код (створюється при build)
├── scripts/
│   └── azure/
│       ├── 10-create-resource-group-and-webapp.sh  ← Створення ресурсів
│       └── 11-create-service-principal.sh          ← Створення SP
└── README.md
```

---

## 🎯 Покрокова інструкція деплою

### 1️⃣ Підготовка Azure ресурсів

```bash
# Створити ресурси
./scripts/azure/10-create-resource-group-and-webapp.sh

# Створити Service Principal
./scripts/azure/11-create-service-principal.sh
```

### 2️⃣ Налаштування GitHub Secrets

1. Відкрийте: https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions
2. Додайте `AZURE_CREDENTIALS` (JSON з попереднього кроку)
3. Додайте `AZURE_RESOURCE_GROUP` = `sushi-shop-rg`

### 3️⃣ Запуск деплою

```bash
# Переключитись на гілку frontend
git checkout frontend

# Зробити зміни (наприклад, оновити README)
git add .
git commit -m "Trigger deployment"

# Відправити в GitHub
git push origin frontend
```

### 4️⃣ Перевірка результату

1. Перейдіть: https://github.com/AlekseyOL2004/sushi_shop/actions
2. Дочекайтесь завершення workflow (✅)
3. Відкрийте: https://ztu-sushi-shop.azurewebsites.net

---

## 🔗 Корисні посилання

| Ресурс | URL |
|--------|-----|
| GitHub Repository | https://github.com/AlekseyOL2004/sushi_shop |
| GitHub Actions | https://github.com/AlekseyOL2004/sushi_shop/actions |
| GitHub Secrets | https://github.com/AlekseyOL2004/sushi_shop/settings/secrets/actions |
| Azure Portal | https://portal.azure.com |
| Deployed Frontend | https://ztu-sushi-shop.azurewebsites.net |
| GitHub Actions Docs | https://docs.github.com/en/actions |
| Azure Web Apps Deploy | https://github.com/Azure/webapps-deploy |
| Azure Login Action | https://github.com/Azure/login |

---

## 💬 Підтримка

Якщо виникли питання:

1. ✅ Перевірте розділ [Поширені проблеми](#поширені-проблеми)
2. 📋 Перегляньте логи в GitHub Actions
3. 🔍 Перевірте Azure Portal → Web App → Deployment Center
4. 📧 Створіть issue в репозиторії

---

**Успішного деплою Sushi Shop! 🍣🚀**