FROM php:8.4-cli

# Install system dependencies & PostgreSQL PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    zip \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath

# Copy Composer from official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Set permissions for storage & bootstrap cache
RUN chmod -R 777 storage bootstrap/cache

# Install composer dependencies (production mode)
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

EXPOSE 8080

CMD php artisan config:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8080
