FROM node:18-alpine
WORKDIR /app

# Копируем package.json отдельно для кэширования зависимостей
COPY package*.json ./

# Сначала устанавливаем все зависимости (включая dev)
RUN npm install

# Затем копируем исходный код
COPY . .

# Создаем production сборку (если нужно)
# RUN npm run build

EXPOSE 5000
CMD ["node", "server.js"]
