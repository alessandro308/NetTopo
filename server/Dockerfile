FROM node

WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN npm install 
EXPOSE 5000
EXPOSE 3000

ENTRYPOINT /bin/bash