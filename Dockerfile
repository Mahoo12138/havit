# syntax=docker/dockerfile:1.6

# ============================================================
# Stage 1: build frontend
# ============================================================
FROM node:22-alpine AS frontend
WORKDIR /app/web

COPY web/package.json web/pnpm-lock.yaml ./
RUN corepack enable \
 && corepack prepare pnpm@10.22.0 --activate \
 && pnpm install --frozen-lockfile

COPY web/ ./
# vite.config.ts outputs to ../internal/static/dist, so we need the parent dir to exist.
RUN mkdir -p /app/internal/static \
 && pnpm build

# ============================================================
# Stage 2: build backend
# ============================================================
FROM golang:1.24-alpine AS backend
WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Replace any placeholder dist with the freshly built frontend assets.
COPY --from=frontend /app/internal/static/dist ./internal/static/dist

# modernc/sqlite is pure Go, so CGO is disabled.
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /out/havit ./cmd/havit

# ============================================================
# Stage 3: runtime image
# ============================================================
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -u 10001 havit \
 && mkdir -p /data \
 && chown -R havit:havit /data

WORKDIR /app
COPY --from=backend /out/havit /app/havit

ENV HAVIT_DATA_DIR=/data
ENV HAVIT_SERVER_PORT=3000

USER havit
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/healthz || exit 1

ENTRYPOINT ["/app/havit"]
