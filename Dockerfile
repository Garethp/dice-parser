FROM node

WORKDIR /usr/src/app

COPY package.json .
COPY README.md .
COPY tsconfig.json .
ADD src ./src

RUN npm ci
RUN npm run build

CMD ["npm", "start"]
