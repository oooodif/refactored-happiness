FROM node:18-slim

WORKDIR /app

# Install minimal system dependencies for Tectonic
RUN apt-get update -y && \
    apt-get install -y curl build-essential fontconfig libfontconfig1-dev \
    libharfbuzz-dev libfreetype6-dev libgraphite2-dev libicu-dev libssl-dev \
    zlib1g-dev unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Tectonic LaTeX compiler
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh && \
    chmod +x tectonic && \
    mv tectonic /usr/local/bin/ && \
    tectonic --version

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV production

# Start the application
CMD ["npx", "tsx", "server/index.ts"]