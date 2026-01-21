FROM nginx:alpine

COPY . /usr/share/nginx/html

# Копируем конфигурацию Nginx (если нужно)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
