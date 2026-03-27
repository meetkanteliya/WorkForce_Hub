#!/bin/bash

echo "⏳ Waiting for database..."
sleep 3

echo "🔄 Running migrations..."
python manage.py migrate --noinput

echo "👤 Creating admin user..."
python manage.py createadmin

echo "📦 Running seed_data.py..."
python seed_data.py

echo "🚀 Starting server..."
daphne -b 0.0.0.0 -p 8000 config.asgi:application