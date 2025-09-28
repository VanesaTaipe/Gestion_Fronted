# Usar la versión correcta de Node.js
FROM node:22-alpine

# Instalar el Angular CLI globalmente dentro de la imagen
RUN npm install -g @angular/cli

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de dependencias
COPY package.json package-lock.json ./

# Instalar las dependencias del proyecto (como en el README)
RUN npm install --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto por defecto de Angular
EXPOSE 4200

# Comando para iniciar el servidor de desarrollo, escuchando en todas las interfaces
CMD ["ng", "serve", "--host", "0.0.0.0"]