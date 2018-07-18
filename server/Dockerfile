FROM node

RUN apt-get update && apt-get install -y vim nano iputils-ping traceroute
WORKDIR /usr/src/app
COPY . .
RUN npm install 
EXPOSE 5000
EXPOSE 3000

ENTRYPOINT /bin/bash
