FROM node:14.17-alpine

# Set the working directory
WORKDIR /app

# Copy the app dependencies
COPY ./package.json ./yarn.lock ./

# Install the app dependencies
RUN yarn

# Copy the code in docker image
COPY . .

# Set the ENV variable for API calls
ENV VUE_APP_FRONTEND_API_BASE_URL=https://api.juliancoinapp.com/v1

# Build for production
RUN yarn build

# Serve the production build found in dist directory
CMD yarn && yarn deploy