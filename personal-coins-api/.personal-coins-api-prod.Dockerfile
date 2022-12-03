FROM node:14.17-alpine

# Set the working directory
WORKDIR /app

# Copy the app dependencies
COPY ./package.json ./yarn.lock ./

# Install the app dependencies
RUN yarn

# Copy the code in docker image
COPY . .

# Build the actual (production) file
RUN yarn build

# Serve the production build found in dist directory (refer to package.json)
CMD yarn start:prod