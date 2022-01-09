FROM node:10.16-alpine

ENV TZ=Asia/Bangkok

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 8443

CMD [ "node", "app.js" ]
