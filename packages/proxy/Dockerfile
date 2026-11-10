FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration and package manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/proxy/package.json packages/proxy/tsconfig.json ./packages/proxy/

# Install dependencies and build proxy
RUN pnpm install --filter @payguard/proxy... --frozen-lockfile=false
COPY packages/proxy/src ./packages/proxy/src
RUN pnpm --filter @payguard/proxy build

EXPOSE 3100

CMD ["node", "packages/proxy/dist/index.js"]

