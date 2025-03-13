# Use Node 18 to satisfy AWS Textract's >=18 requirement
FROM node:18-buster-slim

# Install GraphicsMagick so pdf2pic can call "gm"
RUN apt-get update && apt-get install -y graphicsmagick && apt-get clean

# Create and switch to the app directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock first
COPY package.json yarn.lock ./

# Install ALL dependencies (including dev) so we can build
RUN yarn install

# Copy the rest of your backend code
COPY . .

# Build your TypeScript into /dist
RUN yarn build

# Remove devDependencies after building to reduce image size
RUN yarn install --production --ignore-scripts --prefer-offline

# Expose the port your server listens on (3000 for example)
EXPOSE 3000

# Start the compiled server
CMD ["yarn", "start"]
