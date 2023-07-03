# Stage 1 for building the app
FROM node:18-alpine as build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run prisma:generate
RUN npm run build

# Stage 2 for running the app
FROM node:18-alpine
WORKDIR /app

COPY --from=build /app/.env ./

COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/dist ./dist
ENTRYPOINT ["npm", "run", "start:prod"]
