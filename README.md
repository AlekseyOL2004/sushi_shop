# HelloDockerRealWorld — швидка інструкція

<!-- Badges -->

![Node.js](https://img.shields.io/badge/Node-18-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-4.3.9-lightgrey)
![Docker](https://img.shields.io/badge/Docker-%20-blue)
![Backend CI/CD](https://github.com/AlekseyOL2004/sushi_shop/actions/workflows/deploy-backend.yml/badge.svg)
![Frontend Deploy](https://github.com/AlekseyOL2004/sushi_shop/actions/workflows/deploy-frontend-azure.yml/badge.svg?branch=frontend)

> **🚀 ІНСТРУКЦІЯ З ДЕПЛОЮ В AZURE**
>
> Покроковий гайд як задеплоїти проект з повним CI/CD (Frontend + Backend + DB): [**AZURE_DEPLOY_GUIDE.md**](./AZURE_DEPLOY_GUIDE.md)

| Компонент | Мова / Фреймворк        | Основні бібліотеки / інструменти                                                 | Коротко                                                                                            |
| --------- | ----------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API       | Node.js / Express       | express, mongoose, dotenv, validator; mongodb-memory-server (dev), nodemon (dev) | Сервер у `api/src`, локальний запуск через `app.local.js` підтримує in-memory Mongo                |
| Frontend  | React 18 / Vite         | react, react-dom, react-router-dom, vite, @vitejs/plugin-react                   | Клієнт у `frontend/src`, Vite для dev, збірка у `frontend/build`, маршрутизація через React Router |
| DevOps    | Docker / Docker Compose | Dockerfile(.dev/.prod), docker-compose.yml, docker-compose.dev.yml               | Прод: frontend 3000 / api 3001, Dev: frontend 3003 / api 3002                                      |
| Database  | MongoDB                 | mongo:latest                                                                     | NoSQL база даних на порту 27017                                                                    |

README узагальнює поточні налаштування проекту: Dockerfile-и, docker-compose для продакшену та розробки, локальний запуск без Docker (включно з in-memory Mongo), а також `.env.local` для демонстрацій.

## Зміст

- [Структура проекту](#структура-проекту)
- [Опис гілок](#опис-гілок)
- [Запуск (Docker)](#запуск-docker)
- [Локальний запуск без Docker](#локальний-запуск-без-docker)
- [Прив'язка хоста](#прив'язка-хоста--localhost-або-00-00-00)
- [Перевірка hot-reload (development)](#перевірка-hot-reload-development)

## Структура проекту

<details>
<summary>Розгорнути / Згорнути — короткий огляд файлів (корисно для швидкого ознайомлення)</summary>

### Візуальне дерево (основні директорії)

```
├─ api/
│  ├─ Dockerfile(.dev)
│  ├─ package.json
│  └─ src/
│     ├─ app.js          # Express app
│     ├─ app.local.js    # Local dev entry (mongodb-memory-server)
│     ├─ configuration/  # конфіг (port, host, mongoURL)
│     ├─ routers/        # маршрути (users)
│     └─ models/         # Mongoose models (User)
└─ frontend/
  ├─ package.json
  ├─ vite.config.js
  └─ src/
    ├─ main.jsx        # React entry
    ├─ App.jsx         # головний компонент
    └─ components/     # UserForm, UsersList
```

### Таблиця файлів (коротко)

| Файл / Папка                            | Короткий опис                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `api/src/app.js`                        | Основний Express-додаток — підключає middleware та маршрути; стартує при підключенні до Mongo   |
| `api/src/app.local.js`                  | Локальний запуск: завантажує `.env.local` (якщо є) та піднімає in-memory Mongo для зручного dev |
| `api/src/routers/user.js`               | Маршрути `/users` (GET список, POST створення) + базова валідація помилок                       |
| `api/src/models/user.js`                | Mongoose-модель `User` з простими валідаторами (email через validator)                          |
| `api/.env.local`                        | Демонстраційні змінні оточення (локально)                                                       |
| `frontend/src/main.jsx`                 | Вхідний файл React (створює root і рендерить `App`)                                             |
| `frontend/src/App.jsx`                  | Головний компонент — об'єднує `UserForm` і `UsersList` і керує оновленням                       |
| `frontend/src/components/UserForm.jsx`  | Форма створення користувача; робить POST на API та відображає field-level помилки               |
| `frontend/src/components/UsersList.jsx` | Завантажує і відображає список користувачів з API                                               |
| `frontend/vite.config.js`               | Конфіг Vite (dev server, build)                                                                 |
| `frontend/package.json`                 | npm-скрипти: `start` (vite), `build`, `preview`                                                 |

</details>

## Опис гілок

- `main` — стабільна production-галузь: тут зберігаються релізи та готові до деплою зміни.
- `develop` — основна інтеграційна гілка для активної розробки та тестування перед злиттям в `main`.
- `frontend` — робота над клієнтською частиною (Vite / React). Ця гілка містить зміни інтерфейсу та фронтенд-логіки.
- `api` — робота над бекендом (папка `api`): зміни в маршрутах, моделях, конфігураціях сервера.

У цьому репозиторії використовуються такі механіки:

- `docker-compose.yml` — конфігурація для продакшен-стеку (production)
- `docker-compose.dev.yml` — доповнення для локальної розробки (dev)
- `api/.env.local` — демонстраційний локальний env (підхоплюється `app.local.js` через dotenv)
- `api/src/app.local.js` — файл, який при відсутності MONGO_URL запускає mongodb-memory-server (in-memory Mongo) і виводить URI у лог
- Dockerfile-и підтримують build-arg `NODE_IMAGE` (щоб легко перемикати образ Node при збірці)

---

## Основні відмінності Prod vs Dev

- Імена контейнерів тепер явні і містять суфікси `_prod` або `_dev` (щоб уникнути колізій):
  - prod: `api_prod`, `frontend_prod`, `api_db_prod`
  - dev: `api_dev`, `frontend_dev`, `api_db_dev`
- Порти на хості відрізняються між продом і девом, щоб було наглядніше і не було конфліктів:
  - Production (docker-compose.yml):
    - frontend → host:3000 → container:3000
    - api → host:3001 → container:3001
  - Development (docker-compose.dev.yml):
    - frontend → host:3003 → container:3000
    - api → host:3002 → container:3001

Примітка: volume для Mongo (`mongodb_api`) зараз спільний у обох compose-файлах, тому якщо ви піднімаєте обидва стеки одночасно — вони будуть читати/писати в один том. Якщо ви хочете повну ізоляцію даних між prod і dev, створіть окремі томи (`mongodb_api_dev`, `mongodb_api_prod`).

---

## Запуск (Docker)

1. Production стек (prod):

```bash
docker compose up --build
```

2. Development стек (dev) — окремо:

```bash
docker compose -f docker-compose.dev.yml up --build
```

3. Якщо хочете підняти обидва одночасно (необхідно врахувати спільний том):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Після підняття контейнерів ви можете дивитись логи по іменах контейнерів, наприклад:

```bash
docker compose -f docker-compose.dev.yml logs -f api_dev
docker ps --filter "name=api_prod"
```

---

## Локальний запуск без Docker (корисно для навчання)

В проекті є зручні npm-скрипти для запуску API локально, навіть якщо немає встановленого Mongo:

- `npm run dev:local` — development локально (nodemon) + mongodb-memory-server (якщо `MONGO_URL` не заданий). Файл запуску: `api/src/app.local.js`.
- `npm run prod:local` — production-like локальний запуск (NODE_ENV=production) теж через `app.local.js` і вмикає in-memory Mongo за потреби.

Після старту `app.local.js` буде логуватися рядок виду:

```
In-memory MongoDB started. Connection URI: mongodb://127.0.0.1:57098/...
```

Цей URI можна використовувати в `mongosh`, MongoDB Compass або DBeaver для перегляду бази під час сесії.

Щоб використати файл змінних оточення (наприклад, інший MONGO_URL), створіть `api/.env.local` або передайте `DOTENV_PATH=./.env.my` при запуску:

```bash
DOTENV_PATH=./.env.custom npm run dev:local
```

---

## Прив'язка хоста — `localhost` або `0.0.0.0`

Коротко: сервер можна запускати так, щоб він був доступний тільки з вашої машини (`localhost`), або доступний ззовні (всі інтерфейси) через адресу `0.0.0.0`.

- Локальний запуск (наприклад `node src/app.js`) за замовчуванням краще робити з `HOST=localhost` — тоді сервіс буде доступний тільки з вашої машини на `http://localhost:PORT`.
- У контейнерах Docker зазвичай використовують `HOST=0.0.0.0`. Це дозволяє Docker пробросити порт контейнера на хост і робити сервіс доступним ззовні (тобто `docker compose` може мапити порт контейнера на `localhost:3001` або інший порт вашої машини).

Технічна деталь: якщо в коді ви викликаєте `app.listen(port, host)`, то прив'язка буде відповідати переданому `host`. Якщо викликаєте `app.listen(port)` без `host`, Node зазвичай слухає на всіх інтерфейсах (еквівалентно `0.0.0.0`), але краще задавати `host` явно для уникнення плутанини в логах.

Файли `docker-compose.yml` у ваших прикладах можуть встановлювати `HOST=0.0.0.0` для контейнера — це нормально і необхідно для коректного порт-форвардингу.

---

## Перевірка hot-reload (development)

1. Запустіть development стек (див. вище) або локально `npm run dev:local`.
2. Змініть будь-який файл у `api/src` (наприклад `api/src/app.js` або `api/src/routers/user.js`).
3. У контейнері development використовується `nodemon`, який стежить за змінами у `src` (завдяки томові `./api/src:/usr/src/app/src`) і автоматично перезапустить процес Node.

Щоб побачити перезапуск у логах:

```bash
docker compose -f docker-compose.dev.yml logs -f api_dev
```

Або, якщо запускаєте локально без Docker:

```bash
npm run dev:local
# у іншому терміналі переглядайте логи виводу процесу (console.log з nodemon)
```

---

## Build-arg `NODE_IMAGE`

Dockerfile-и у проекті параметризовано через `ARG NODE_IMAGE`, а `docker-compose` передає `build.args.NODE_IMAGE`. Це дає змогу легко змінювати базовий образ Node (наприклад `node:22-bullseye-slim` або `node:22.14.0-bullseye-slim`) без редагування Dockerfile.

Приклад збірки з іншим образом:

```bash
docker compose build --build-arg NODE_IMAGE=node:22-bullseye-slim
```

Рекомендація: для local/CI використовувати `node:22-bullseye-slim` (сумісніший), а для production при бажанні можна обрати більш легкий alpine-образ — але пам'ятайте про сумісність нативних залежностей.

---

## Як створити локальні `docker-compose` файли (якщо вони не в репозиторії)

У цьому проєкті ми не комитимо `docker-compose` файли з конфіденційними або локальними налаштуваннями. Нижче — готові приклади, які ви можете скопіювати у свій локальний робочий каталог як `docker-compose.yml` (prod) та `docker-compose.dev.yml` (dev).

1. Створіть `docker-compose.yml` з таким вмістом (production):

```yaml
version: "3"
services:
  api:
    container_name: api_prod
    build:
      context: ./api
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: npm start
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - MONGO_URL=mongodb://api_db:27017/api
    depends_on:
      - api_db

  frontend:
    container_name: frontend_prod
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: serve -s build -l 3000
    ports:
      - "3000:3000"
    depends_on:
      - api

  api_db:
    container_name: api_db_prod
    image: mongo:latest
    volumes:
      - mongodb_api:/data/db

volumes:
  mongodb_api:
```

2. Створіть `docker-compose.dev.yml` з цим вмістом (development):

```yaml
version: "3"
services:
  api:
    container_name: api_dev
    build:
      context: ./api
      dockerfile: Dockerfile.dev
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: npm run dev
    ports:
      - "3002:3001" # dev API доступний на хості 3002
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - MONGO_URL=mongodb://api_db:27017/api
    volumes:
      - ./api/src:/usr/src/app/src
    depends_on:
      - api_db

  frontend:
    container_name: frontend_dev
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      args:
        NODE_IMAGE: node:22-bullseye-slim
    command: npm start
    ports:
      - "3003:3000" # dev frontend доступний на хості 3003
    environment:
      - VITE_API_BASE=${VITE_API_BASE:-http://localhost:3002}
    volumes:
      - ./frontend:/usr/src/app
      - /usr/src/app/node_modules
    stdin_open: true
    tty: true
    depends_on:
      - api

  api_db:
    container_name: api_db_dev
    image: mongo:latest
    volumes:
      - mongodb_api:/data/db

volumes:
  mongodb_api:
```

Пояснення і поради:

- `container_name` робить імена контейнерів предсказуваними (ми використовуємо `_prod` та `_dev` суфікси).
- У dev ми прив'язали інші хост-порти (3002/3003), щоб одночасно можна було піднімати prod і dev без колізій.
- `VITE_API_BASE` у dev за замовчуванням вказує на `host.docker.internal`, це дозволяє контейнеру фронтенду звертатись до API на хості (корисно для Docker Desktop/macOS). Можеш замінити на `http://localhost:3002` якщо у твоїй системі це працює.
- Якщо хочеш повну ізоляцію даних між prod і dev — змініть назви томів (`mongodb_api` → `mongodb_api_dev` для dev).

Зберігайте ці файли локально (не комить у публічний репозиторій), і потім запускайте відповідні команди з README.

---

## .env.local (демо) та безпека

В `api/` додано `api/.env.local` з демонстраційними значеннями (щоб студентам було просто стартувати). Також додано `api/ENV_LOCAL_README.md` з поясненням українською.

Увага:

- `.env.local` в цьому репозиторії — демонстраційний. Якщо ви працюєте з реальними ключами/секретами — не комітьте їх у публічні репозиторії.

---

## Перевірка API / приклади curl

Production (prod) — порт 3001:

```bash
curl -i -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}'
```

Development (dev) — порт 3002:

```bash
curl -i -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ivan","lastName":"Petrov","email":"ivan.petrov@example.com"}'
```

Отримати список користувачів:

```bash
curl -i http://localhost:3001/users   # prod
curl -i http://localhost:3002/users   # dev
```

---

## Примітки щодо одночасного запуску prod і dev

- Ми додали `container_name` з суфіксами `_prod` і `_dev`, тому імена контейнерів не конфліктують.
- Але наразі volume `mongodb_api` спільний для обох файлів. Якщо ви хочете ізольовані дані для dev і prod, змініть назву тому у `docker-compose.dev.yml` (наприклад на `mongodb_api_dev`).

---

## Makefile (зручні цілі)

Якщо у корені є `Makefile`, його цілі (наприклад `make dev`, `make prod`, `make both`) є зручними обгортками для команд `docker compose`.

---

Якщо хочеш, оновлю README ще детальніше (додати таблицю портів, приклади mongosh/Compass, або інструкцію як зафіксувати образи через digest). Напиши що додати — і я внесу правки.

## 📚 Документація ## 📚 Документація

- [WEBAPP_API_DEPLOYMENT.md](./WEBAPP_API_DEPLOYMENT.md) — Детальна покрокова інструкція - [WEBAPP_API_DEPLOYMENT.md](./WEBAPP_API_DEPLOYMENT.md) — Детальна покрокова інструкція
- [FRONTEND_CI_CD_SETUP.md](./FRONTEND_CI_CD_SETUP.md) — Налаштування CI/CD для frontend
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/) - [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure App Service](https://docs.microsoft.com/azure/app-service/) - [Azure App Service](https://docs.microsoft.com/azure/app-service/)
- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/) - [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/)

## 🌐 Live URLs

| Компонент | URL | Статус | Примітка |
|-----------|-----|--------|----------|
| Frontend | https://ztu-sushi-frontend.azurewebsites.net | ![Status](https://img.shields.io/website?url=https://ztu-sushi-frontend.azurewebsites.net) | HTTPS ✅ |
| API Proxy (Cloudflare) | https://sushi-api-proxy.YOUR_USERNAME.workers.dev | ![Status](https://img.shields.io/website?url=https://sushi-api-proxy.YOUR_USERNAME.workers.dev/health) | HTTPS Proxy ✅ |
| Backend API (Direct) | http://ztu-sushi-api.polandcentral.azurecontainer.io:3001 | ![Status](https://img.shields.io/website?url=http://ztu-sushi-api.polandcentral.azurecontainer.io:3001/health) | HTTP Only (через Cloudflare) |
| MongoDB | MongoDB Atlas (Cloud) | ![Status](https://img.shields.io/badge/status-online-success) | HTTPS ✅ |

### ⚠️ Mixed Content рішення

**Проблема:** Azure App Service завжди використовує HTTPS, що блокує HTTP запити до API (Mixed Content).

**Рішення:** Cloudflare Worker як HTTPS proxy
- Frontend робить запити на `https://sushi-api-proxy.YOUR_USERNAME.workers.dev` (HTTPS ✅)
- Cloudflare Worker проксує запити на `http://ztu-sushi-api...` (HTTP)
- **Безкоштовно, швидко, надійно!**

**Альтернативи для production:**
- Azure Front Door ($$)
- Azure Application Gateway ($$$)
- Nginx reverse proxy з Let's Encrypt
