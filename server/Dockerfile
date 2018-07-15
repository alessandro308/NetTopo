FROM node

RUN apt-get update && apt-get install -y vim nano
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN npm install 
EXPOSE 5000
EXPOSE 3000

ENTRYPOINT /bin/bash