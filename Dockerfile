FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
