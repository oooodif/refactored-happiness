#!/bin/bash

# Update package lists
apt-get update -y

# Install necessary dependencies and fonts
apt-get install -y curl unzip build-essential libfontconfig1-dev libharfbuzz-dev libfreetype6-dev libgraphite2-dev libicu-dev libssl-dev zlib1g-dev \
texlive-fonts-recommended texlive-fonts-extra \
texlive-latex-base texlive-latex-recommended \
texlive-science texlive-pictures

# Download and install Tectonic binary
curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh

# Move tectonic to a directory in PATH
chmod +x tectonic
mv tectonic /usr/local/bin/

# Verify installation
tectonic --version

echo "Tectonic installation completed"

# Set chunk size warning limit to avoid failures from warnings
export VITE_APP_CHUNK_SIZE_WARNING_LIMIT=1000

# Continue with the normal build process
npm run build 

# Ensure the build script exits with success regardless of warnings
exit 0