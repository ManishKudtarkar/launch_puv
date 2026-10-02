FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm ci

COPY prisma.config.ts tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build


FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# AWS RDS CA certificate bundle
COPY rds-ca-bundle.pem ./rds-ca-bundle.pem

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate:deploy && npm run start:prod"]
