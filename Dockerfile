FROM node:26-alpine AS base
RUN npm install -g pnpm@11.2.2
WORKDIR /home/node/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS deps
RUN pnpm install --frozen-lockfile --prod

FROM node:26-alpine
WORKDIR /home/node/app
ENV NODE_ENV=production
COPY package.json ./
COPY --from=deps /home/node/app/node_modules ./node_modules
COPY --from=builder /home/node/app/dist ./dist
USER node
EXPOSE 5000
CMD ["node", "dist/index.js"]
