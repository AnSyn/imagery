# Stage 1: Build
FROM node:lts as builder

WORKDIR /imagery-tester
COPY package*.json /imagery-tester/

RUN npm install

COPY ./ /imagery-tester/

RUN npm run build:prod

# Stage 2: Setup
FROM nginx:1.19.1-alpine

RUN apk update \
  && apk add ca-certificates wget \
  && update-ca-certificates

RUN rm -f /usr/share/nginx/html/*
COPY --from=builder /imagery-tester/dist/imagery-tester /usr/share/nginx/html
