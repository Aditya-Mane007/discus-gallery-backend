#!/usr/bin/env bash

set -euo pipefail

echo "========================================"
echo "Project Setup Started"
echo "========================================"



echo "Deleting the existing docker volumes...."
docker compose down -v

echo "Starting Docker services..."
docker compose up -d

# PostgreSQL Configuration
CONTAINER_NAME="postgres_db"
DB_USER="aditya"
DB_NAME="discus-gallery"

echo "========================================"
echo "Database Initialization Started"
echo "========================================"

# Wait until PostgreSQL is ready
echo "========================================"
echo "Waiting for PostgreSQL..."
echo "========================================"

until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" >/dev/null 2>&1; do
    sleep 2
done

echo "========================================"
echo "PostgreSQL is ready."
echo "========================================"


# Schema files (Executed first)
SCHEMA_FILES=(
    # "src/modules/admin/auth/model/auth-schema.sql"
    # "src/modules/admin/module/model/module-resource-permission.sql"
    "scripts/IAM/IAM.sql"
)

# Seed files (Executed after all schemas)
SEED_FILES=(
    # "src/modules/admin/auth/seed-data/auth-seed-data.js"
    # "src/modules/admin/module/seed-data/iam-seed-data.js"
    "scripts/seed-data/modules/portal-seed-data.js"
    "scripts/seed-data/modules/module-resourse-management.js"
    "scripts/seed-data/modules/org.js"
)

execute_sql_files() {
    local files=("$@")

    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "❌ File not found: $file"
            exit 1
        fi

        echo "▶ Executing $file..."

        docker exec -i "$CONTAINER_NAME" \
            psql \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -v ON_ERROR_STOP=1 \
            < "$file"

        echo "✔ Done"
        echo
    done
}

execute_js_files(){
    local files=("$@")

    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "❌ File not found: $file"
            exit 1
        fi

        echo "▶ Executing $file..."

        node "$file"

        echo "✔ Done"
        echo
    done
}

echo "========================================"
echo "Creating database schema..."
echo "========================================"

execute_sql_files "${SCHEMA_FILES[@]}"
execute_js_files "${SEED_FILES[@]}"

# echo "Seeding default data..."
# execute_sql_files "${SEED_FILES[@]}"

echo "========================================"
echo "Database Initialization Completed"
echo "========================================"