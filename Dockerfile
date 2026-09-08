# syntax=docker/dockerfile:1

###############################################################################
# Base: Node 24 + pnpm via corepack (misma version que package.json#packageManager)
###############################################################################
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_maxtimeout=120000
ENV npm_config_network_concurrency=8

###############################################################################
# deps: dependencias completas; hacen falta las dev para compilar Next.
###############################################################################
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

###############################################################################
# build: compila Next en modo standalone
###############################################################################
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CRITICO: las variables NEXT_PUBLIC_* se inlinean en el bundle durante el
# build, NO se leen en runtime. Si no se define aqui, la imagen apuntara para
# siempre al valor por defecto y pasarla con `docker run -e` no tendra efecto.
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.sisebt.mx/api/v1 .
ARG NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Requiere `output: "standalone"` en next.config.ts (ya configurado): emite
# .next/standalone con un server.js y solo las dependencias que realmente usa.
RUN pnpm build

###############################################################################
# runner: imagen final, minima
###############################################################################
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Sin esto el server standalone escucha solo en localhost y queda inalcanzable
# desde fuera del contenedor.
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static     ./.next/static
COPY --from=build --chown=node:node /app/public           ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
