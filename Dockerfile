# =========================
# Stage 1: Build
# =========================
# Node 22 LTS - Angular 19 supports ^18.19.1, ^20.11.1 and >=22.0.0.
FROM node:22.23.3-alpine AS builder

WORKDIR /app

# Dependencies first: this layer is reused until package-lock.json changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The production configuration is angular.json's default: optimised, hashed
# file names, environment.prod.ts. Output: dist/taskpulse_web/browser
RUN npm run build


# =========================
# Stage 2: Runtime
# =========================
# Just nginx and the static files - no Node, no source, no node_modules.
# The unprivileged variant runs as user 101 and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.30.5-alpine

ARG VERSION=dev
ARG GIT_SHA=dev
ARG BUILD_NUMBER=dev
LABEL org.opencontainers.image.title="taskpluse-web" \
      org.opencontainers.image.source="https://github.com/sokhin-devops/taskpluse_web" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      build.number="${BUILD_NUMBER}"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/taskpulse_web/browser /usr/share/nginx/html

# Numeric, so Kubernetes' runAsNonRoot can verify it.
USER 101

EXPOSE 8080

# For `docker run`; Kubernetes ignores this and uses its own probes.
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
