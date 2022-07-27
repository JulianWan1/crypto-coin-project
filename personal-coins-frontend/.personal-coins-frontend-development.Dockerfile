FROM node:14.17-alpine

WORKDIR /app

COPY ./package.json ./

RUN yarn

COPY . .

ARG PORT

EXPOSE ${PORT}

CMD yarn && yarn serve