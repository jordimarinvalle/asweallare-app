FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

# Copy source files
COPY . .

# Expose port
EXPOSE 3001

# Start development server
CMD ["yarn", "dev"]
