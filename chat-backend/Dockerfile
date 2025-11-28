FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node","index.js"]

