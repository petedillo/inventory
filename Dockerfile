FROM node:lts AS development

WORKDIR /backend

ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV

COPY package*.json ./
RUN npm install

# Remove package-lock.json (optional)
RUN rm -rf package-lock.json

COPY . .

# Completely reinstall bcrypt
RUN npm uninstall bcrypt
RUN npm install bcrypt

# Install nodemon globally
RUN npm install -g nodemon

# Start the application with Nodemon
CMD [ "npm", "run", "dev" ]