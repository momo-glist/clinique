# Étape 1 : build
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : serveur nginx pour servir les fichiers
FROM nginx:alpine

# Copier le build React dans le dossier nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copier la config nginx si besoin (facultatif)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

