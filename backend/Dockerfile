FROM node:18-alpine
WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости (включая dev для разработки)
RUN npm install

# Копируем остальной код
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
