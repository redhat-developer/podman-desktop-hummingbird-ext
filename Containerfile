FROM node:24-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g corepack@0.31.0 && corepack enable

COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM scratch

COPY --from=builder /app/packages/backend/dist/ /extension/dist
COPY --from=builder /app/packages/backend/package.json /extension/
COPY --from=builder /app/packages/backend/media/ /extension/media
COPY --from=builder /app/LICENSE /extension/
COPY --from=builder /app/packages/backend/icon.png /extension/
COPY --from=builder /app/README.md /extension/

LABEL org.opencontainers.image.title="Hummingbird Extension" \
        org.opencontainers.image.description="Hummingbird Extension" \
        org.opencontainers.image.vendor="redhat" \
        io.podman-desktop.api.version=">= 1.25.0"
