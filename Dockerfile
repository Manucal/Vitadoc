# Stage 1: Builder - Compilar TypeScript a JavaScript
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Compilar TypeScript a JavaScript
RUN npm run build

# Stage 2: Runtime - Ejecutar solo el código compilado
FROM node:18-alpine

WORKDIR /app

# Copiar package.json para información
COPY package.json ./

# Copiar solo lo necesario del builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Exponer puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "dist/server.js"]
