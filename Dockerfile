# Stage 1: Frontend build
FROM node:22-alpine AS frontend
ARG GIT_HASH=unknown
ARG BUILD_TIME=unknown
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
ENV VITE_GIT_HASH=$GIT_HASH VITE_BUILD_TIME=$BUILD_TIME
RUN npx vite build

# Stage 2: PocketBase runtime
FROM alpine:3.21
ARG PB_VERSION=0.36.2
ARG TARGETARCH
RUN apk add --no-cache ca-certificates curl unzip && \
    curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -o /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /app && rm /tmp/pb.zip && chmod +x /app/pocketbase

COPY --from=frontend /app/dist /app/pb_public
COPY pb_runtime/pb_hooks/ /app/pb_hooks/
COPY pb_runtime/pb_migrations/ /app/pb_migrations/

EXPOSE 8090
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--hooksDir=/app/pb_hooks", "--migrationsDir=/app/pb_migrations"]
