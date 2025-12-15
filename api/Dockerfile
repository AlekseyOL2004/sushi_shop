ARG NODE_IMAGE=node:22.14.0-bullseye-slim
FROM ${NODE_IMAGE}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3001
CMD [ "npm", "start" ]