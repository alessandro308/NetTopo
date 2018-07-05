FROM node

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
EXPOSE 3000

ENTRYPOINT /bin/sh