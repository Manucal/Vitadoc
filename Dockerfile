# Paso 1: Usar Node.js oficial
FROM node:18-alpine

# Paso 2: Establecer carpeta de trabajo
WORKDIR /app

# Paso 3: Copiar solo lo que necesita el backend (NO frontend)
COPY package.json package-lock.json ./
COPY src ./src
COPY tsconfig.json ./

# Paso 4: Instalar dependencias
RUN npm ci

# Paso 5: Abrir puerto
EXPOSE 3001

# Paso 6: Comando para iniciar
CMD ["node", "-r", "ts-node/register", "src/server.ts"]
