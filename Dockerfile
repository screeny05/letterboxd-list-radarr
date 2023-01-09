FROM node:18-alpine

WORKDIR /home/node/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 5000
CMD npm run start
