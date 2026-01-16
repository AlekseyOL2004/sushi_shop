# 🚀 CI/CD Налаштування для Frontend → Azure Web App

Цей документ описує налаштування автоматичного деплою frontend-застосунку до Azure Web App `test-demo-ztu` при кожному push в гілку `frontend`.

## 📋 Зміст

1. [Огляд процесу](#огляд-процесу)
2. [Передумови](#передумови)
3. [Налаштування Azure](#налаштування-azure)
4. [Налаштування GitHub Secrets](#налаштування-github-secrets)
5. [Перевірка статусу деплою](#перевірка-статусу-деплою)
6. [Поширені проблеми](#поширені-проблеми)

---

## 🔄 Огляд процесу

```
┌──────────────────┐      ┌────────────────┐      ┌──────────────────────┐
│   Push в гілку   │ ───▶ │  GitHub Actions │ ───▶ │  Azure Web App       │
│   "frontend"     │      │  Build & Deploy │      │  test-demo-ztu       │
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
- [ ] Azure Web App `test-demo-ztu` вже створено
- [ ] Azure CLI встановлено локально (для створення credentials)

---

## 🔧 Налаштування Azure

### Крок 1: Створіть Service Principal

Service Principal дозволяє GitHub Actions авторизуватися в Azure.

```bash
# Увійдіть в Azure
az login

# Отримайте ID вашої підписки
az account show --query id --output tsv

# Створіть Service Principal з правами на Web App
# Використовуємо роль "Website Contributor" для мінімальних прав
az ad sp create-for-rbac \
  --name "github-actions-deploy" \
  --role "Website Contributor" \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/test-demo-ztu \
  --json-auth
```

> 💡 **Примітка:** Роль "Website Contributor" надає мінімальні необхідні права для деплою. Якщо виникають проблеми з правами, можна використати роль "Contributor".

**Приклад відповіді:**

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

> ⚠️ **Важливо:** Збережіть весь JSON-вивід — він знадобиться для GitHub secret!

### Крок 2: Переконайтеся, що Web App існує

```bash
# Перевірте що Web App test-demo-ztu існує
az webapp show --name test-demo-ztu --resource-group {your-resource-group} --query name
```

---

## 🔐 Налаштування GitHub Secrets

### Крок 1: Відкрийте налаштування репозиторію

1. Перейдіть на сторінку репозиторію GitHub
2. Натисніть **Settings** → **Secrets and variables** → **Actions**
3. Натисніть **New repository secret**

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

| Поле       | Значення                                    |
| ---------- | ------------------------------------------- |
| **Name**   | `AZURE_RESOURCE_GROUP`                      |
| **Secret** | Назва resource group де знаходиться Web App |

**Приклад значення:** `ztu-webapp-rg`

### Схема налаштування

```
GitHub Repository
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
                                    └── AZURE_RESOURCE_GROUP ← Resource group name
```

---

## 📊 Перевірка статусу деплою

### Спосіб 1: GitHub Actions Tab

1. Перейдіть на GitHub репозиторій
2. Натисніть вкладку **Actions**
3. Знайдіть workflow **"Deploy Frontend to Azure Web App"**
4. Перегляньте статус:
   - ✅ Зелена галочка — успішний деплой
   - ❌ Червоний хрестик — помилка
   - 🟡 Жовте коло — в процесі

### Спосіб 2: Badge в README

Додайте badge у ваш README.md для відображення статусу:

```markdown
![Deploy Frontend to Azure Web App](https://github.com/{your-username}/{your-repo}/actions/workflows/deploy-frontend-azure.yml/badge.svg?branch=frontend)
```

> 💡 Замініть `{your-username}` та `{your-repo}` на ваші значення. Для цього репозиторію використовуйте:

```markdown
![Deploy Frontend to Azure Web App](https://github.com/AlekseyOL2004/sushi_shop/actions/workflows/deploy-frontend-azure.yml/badge.svg?branch=frontend)
```

**Результат:**
![Deploy Frontend to Azure Web App](https://github.com/AlekseyOL2004/sushi_shop/actions/workflows/deploy-frontend-azure.yml/badge.svg?branch=frontend)

### Спосіб 3: Email сповіщення

GitHub автоматично надсилає email сповіщення при:

- Помилках workflow (якщо включено в налаштуваннях)
- Успішному завершенні (опціонально)

Налаштування: **GitHub Profile** → **Settings** → **Notifications**

### Спосіб 4: Azure Portal

1. Відкрийте [Azure Portal](https://portal.azure.com)
2. Знайдіть Web App `test-demo-ztu`
3. Перегляньте **Deployment Center** для історії деплоїв

---

## 🔍 Перегляд логів Workflow

Для детального аналізу виконання:

1. Відкрийте **Actions** → виберіть конкретний run
2. Натисніть на job (**build** або **deploy**)
3. Розгорніть кроки для перегляду логів

```
Workflow Run
    │
    ├── build
    │     ├── Checkout code
    │     ├── Setup Node.js
    │     ├── Install dependencies
    │     ├── Build application
    │     └── Upload build artifact
    │
    └── deploy
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
3. Перевірте що Service Principal не закінчився

```bash
# Перевірка Service Principal
az ad sp show --id {clientId}

# Оновлення прав доступу
az role assignment create \
  --assignee {clientId} \
  --role Contributor \
  --scope /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Web/sites/test-demo-ztu
```

### Проблема 2: "Web App not found"

**Причина:** Web App не існує або неправильне ім'я

**Рішення:**

1. Перевірте назву Web App в Azure Portal
2. Оновіть значення `AZURE_WEBAPP_NAME` у workflow файлі

```yaml
env:
  AZURE_WEBAPP_NAME: test-demo-ztu # ← Перевірте назву
```

### Проблема 3: Build failed

**Причина:** Помилки в коді React

**Рішення:**

1. Перевірте локально:

```bash
cd frontend
npm install
npm run build
```

2. Виправте помилки та push знову

---

## 📁 Структура файлів

```
.github/
└── workflows/
    └── deploy-frontend-azure.yml   ← Workflow файл
frontend/
├── package.json                    ← Залежності
├── src/                           ← Вихідний код
└── dist/                          ← Зібраний код (створюється при build)
```

---

## 🔗 Корисні посилання

- [GitHub Actions документація](https://docs.github.com/en/actions)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
- [Azure Login Action](https://github.com/Azure/login)
- [Azure Portal](https://portal.azure.com)

---

## 💬 Підтримка

Якщо виникли питання:

1. Перевірте розділ [Поширені проблеми](#поширені-проблеми)
2. Перегляньте логи в GitHub Actions
3. Створіть issue в репозиторії

---

**Успішного деплою! 🚀**
