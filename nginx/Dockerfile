FROM nginx:alpine
# Видаляємо дефолтний конфіг
RUN rm /etc/nginx/conf.d/default.conf
# Копіюємо наш конфіг
COPY nginx.conf /etc/nginx/conf.d/default.conf
