FROM node:18-alpine
WORKDIR /app

# Копируем package.json отдельно для кэширования
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код
COPY . .

# Создаем директорию для загрузок
RUN mkdir -p uploads

# Открываем порт
EXPOSE 5000

# Запускаем с nodemon для разработки
CMD ["npm", "run", "dev"]
