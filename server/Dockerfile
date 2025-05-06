# Utiliser une image officielle de Node.js
FROM node:20

# Installer les dépendances système nécessaires pour bcrypt et dockerize
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  curl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installer dockerize
RUN curl -sSL https://github.com/jwilder/dockerize/releases/download/v0.9.3/dockerize-alpine-linux-amd64-v0.9.3.tar.gz -o /tmp/dockerize.tar.gz \
  && tar -xzvf /tmp/dockerize.tar.gz -C /usr/local/bin \
  && rm /tmp/dockerize.tar.gz

# Définir le dossier de travail
WORKDIR /usr/src/app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste de l'application
COPY . .

# Exposer le port utilisé par ton backend
EXPOSE 5000

# Commande pour démarrer le backend en attendant que MySQL soit prêt
CMD ["dockerize", "-wait", "tcp://mysql:3306", "-timeout", "60s", "npm", "start"]



