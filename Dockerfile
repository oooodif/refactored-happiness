# Use the official Node 18 base (Debian-based)
FROM node:18-bullseye

# Install Tectonic
RUN apt-get update && \
    apt-get install -y tectonic && \
    rm -rf /var/lib/apt/lists/*

# Create a working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of your project
COPY . .

# Build your client (if you have a frontend in "client/"):
RUN npm run build

# Expose your server port (change 3000 if you use a different port)
EXPOSE 3000

# Start your server
CMD ["npm", "run", "start"]