FROM node:lts AS development

WORKDIR /backend

ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV

COPY package*.json ./
RUN npm install

# Remove package-lock.json (optional)
RUN rm -rf package-lock.json

COPY . .

# Install nodemon globally
RUN npm install -g nodemon

# Start the application with Nodemon
CMD [ "npm", "run", "watch" ]