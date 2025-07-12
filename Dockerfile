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
# Vite genera la carpeta "dist" por defecto
RUN npm run build
# Si usas yarn:
# RUN yarn build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:stable-alpine

# Copiar los archivos construidos desde la etapa builder
# Vite genera la carpeta "dist"
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]