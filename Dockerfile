# Etapa 1: Construir la aplicación React
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package.json y package-lock.json (o yarn.lock si usas Yarn)
COPY package.json package-lock.json* ./
# Si usas yarn:
# COPY package.json yarn.lock ./

# Instalar dependencias
RUN npm install
# Si usas yarn:
# RUN yarn install

# Copiar el resto de los archivos del proyecto
COPY . .

# Construir la aplicación para producción
# El script "build" usualmente genera la carpeta "build" o "dist"
RUN npm run build
# Si usas yarn:
# RUN yarn build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:stable-alpine

# Asumimos que tu comando de build (npm run build) genera una carpeta "build".
# Si genera una carpeta "dist", cambia "/app/build" a "/app/dist" abajo.
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opcional pero recomendado) Copiar una configuración personalizada de Nginx
# Este archivo default.conf lo crearás en el siguiente sub-paso.
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]