FROM serversideup/php:8.4-fpm-nginx

# Switch to root to install packages
USER root

WORKDIR /var/www/html

# Install Node.js (needed for frontend build)
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    NODE_MAJOR=20 && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs

# Copy composer files
COPY composer.lock composer.json /var/www/html/

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Copy the rest of the application
COPY . /var/www/html

# Remove host-generated Laravel caches that can reference dev-only providers.
RUN rm -f /var/www/html/bootstrap/cache/*.php

# Set APP_URL for build time (needed for route generation)
ARG APP_URL=https://finely.sergheisaurus.com
ENV APP_URL=${APP_URL}

# Build-time Laravel environment for Wayfinder/Vite.
# This is NOT used at runtime (runtime env comes from docker-compose).
ARG APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
ENV APP_ENV=production \
    APP_DEBUG=false \
    APP_KEY=${APP_KEY} \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=sqlite \
    DB_DATABASE=/var/www/html/database/database.sqlite \
    SESSION_DRIVER=array \
    CACHE_STORE=array \
    QUEUE_CONNECTION=sync

# Ensure a sqlite file exists so any boot-time checks don't crash.
RUN mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite

# Ensure Laravel cache directories exist for artisan commands.
RUN mkdir -p \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/sessions \
    /var/www/html/bootstrap/cache \
    /var/www/html/resources/views

# Build Frontend (Requires PHP for Wayfinder)
RUN npm install && npm run build

# Remove node_modules to save space (artifacts are in public/build)
RUN rm -rf node_modules

# Ensure ownership is correct
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 storage bootstrap/cache
