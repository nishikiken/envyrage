#!/bin/bash
cd "$(dirname "$0")"

PORT=8085

# Завершаем старые процессы на этом порту, если они остались
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true

echo "================================================="
echo "   UPGRADER PRO - Локальный запуск проекта"
echo "   Адрес сайта:    http://localhost:$PORT"
echo "   Админ панель:   http://localhost:$PORT/admin"
echo "   (или http://localhost:$PORT/en/admin)"
echo "================================================="

# Открываем браузер с задержкой 1 секунда, чтобы сервер успел запуститься
(sleep 1 && open "http://localhost:$PORT") &
python3 server.py $PORT
