# Node.js 22 (>=22.12.0, exigido em package.json "engines")
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN node -e "const [a,b]=process.versions.node.split('.').map(Number);if(a<22||(a===22&&b<12)){console.error('Node >=22.12.0 exigido');process.exit(1)}" \
 && npm run build
RUN npx esbuild server/db/import-json.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/db-import.cjs

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DOCKERIZED=true

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server/db ./server/db
RUN mkdir -p /var/lib/velomedia && chown node:node /var/lib/velomedia

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.cjs"]
