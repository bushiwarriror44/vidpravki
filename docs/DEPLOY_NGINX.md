# Развёртывание проекта vidpravki с нуля через Nginx

Пошаговая инструкция для поднятия проекта на чистом сервере с Nginx (и опционально HTTPS).

---

## 1. Подготовка сервера

- **ОС:** Ubuntu 22.04 LTS (или другой Linux с systemd).
- Обновление пакетов:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- Установка зависимостей:
  ```bash
  sudo apt install -y curl git
  ```

---

## 2. Установка Docker и Docker Compose

- Установка Docker:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```
  После этого нужно выйти из сессии и зайти снова (или выполнить `newgrp docker`).

- Проверка:
  ```bash
  docker --version
  docker compose version
  ```

---

## 3. Клонирование/копирование проекта на сервер

- Через Git (если репозиторий есть):
  ```bash
  cd /opt  # или другая директория
  sudo git clone <URL_репозитория> vidpravki
  cd vidpravki
  sudo chown -R $USER:$USER .
  ```

- Или загрузить архив проекта и распаковать в `/opt/vidpravki` (или другую папку).

---

## 4. Переменные окружения (.env)

- В корне проекта создать файл `.env` (если его нет):
  ```bash
  cd /opt/vidpravki
  cp .env.example .env
  nano .env
  ```

- Обязательно задать:
  - `SECRET_KEY` — случайная строка (например: `python3 -c "import secrets; print(secrets.token_hex(32))"`).
  - `ADMIN_PASSWORD` — пароль входа в админку.
  - Для продакшена с HTTPS: `SESSION_COOKIE_SECURE=True`.

- Остальные переменные (STATS_URL, STATS_URL_2, ALLOWED_ORIGINS и т.д.) — по необходимости.

---

## 5. Запуск приложения в Docker

- Для развёртывания **без Traefik** (только Nginx) использовать standalone-композ:
  ```bash
  cd /opt/vidpravki
  docker compose -f docker-compose.standalone.yaml build --no-cache
  docker compose -f docker-compose.standalone.yaml up -d
  ```

- Проверка: приложение слушает порт 3914:
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3914/
  ```
  Ожидается ответ 200.

- Данные (БД SQLite и загрузки) хранятся в `./data`. Папку `data` при необходимости создать вручную:
  ```bash
  mkdir -p data
  ```

---

## 6. Установка Nginx

- Установка:
  ```bash
  sudo apt install -y nginx
  ```

- Включение и старт:
  ```bash
  sudo systemctl enable nginx
  sudo systemctl start nginx
  ```

---

## 7. Конфигурация Nginx (прокси на приложение)

- Создать конфиг сайта (подставь свой домен вместо `example.com`):
  ```bash
  sudo nano /etc/nginx/sites-available/vidpravki
  ```

- Содержимое для **HTTP** (порт 80):
  ```nginx
  server {
      listen 80;
      listen [::]:80;
      server_name example.com www.example.com;

      location / {
          proxy_pass http://127.0.0.1:3914;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_connect_timeout 60s;
          proxy_send_timeout 60s;
          proxy_read_timeout 60s;
      }
  }
  ```

- Включить сайт и проверить конфиг:
  ```bash
  sudo ln -s /etc/nginx/sites-available/vidpravki /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  ```

- После этого сайт должен открываться по `http://example.com`.

---

## 8. HTTPS (Let's Encrypt) — опционально

- Разрешить в Nginx доступ к `.well-known` для проверки домена:
  В блок `server` (порт 80) добавить перед `location /`:
  ```nginx
  location /.well-known/acme-challenge/ {
      root /var/www/certbot;
  }
  ```

- Создать каталог и установить Certbot:
  ```bash
  sudo mkdir -p /var/www/certbot
  sudo apt install -y certbot python3-certbot-nginx
  ```

- Получить сертификат (Nginx сам подставит конфиг для HTTPS):
  ```bash
  sudo certbot --nginx -d example.com -d www.example.com
  ```

- В `.env` выставить `SESSION_COOKIE_SECURE=True` и перезапустить контейнер:
  ```bash
  cd /opt/vidpravki
  docker compose -f docker-compose.standalone.yaml up -d --force-recreate
  ```

- Продление сертификата (проверка):
  ```bash
  sudo certbot renew --dry-run
  ```

---

## 9. Финальная конфигурация Nginx для HTTPS (если правишь вручную)

Пример готового конфига с HTTP и HTTPS (как в `deploy/nginx-wth41.biz.conf`):

- **HTTP (80):** редирект на HTTPS или прокси на 3914 + `location /.well-known/` для certbot.
- **HTTPS (443):** `proxy_pass http://127.0.0.1:3914` с теми же заголовками (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`), плюс пути к сертификатам Let's Encrypt.

После правок:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 10. Файрвол (опционально)

- Разрешить HTTP/HTTPS и закрыть прямой доступ к 3914 снаружи:
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```
  Порт 3914 не открывать в UFW — к нему обращается только Nginx с localhost.

---

## 11. Автозапуск при перезагрузке сервера

- Docker Compose с `restart: always` (в `docker-compose.standalone.yaml`) уже поднимает контейнер после перезагрузки.
- Проверка:
  ```bash
  docker ps
  ```
  Контейнер `vidpravki` должен быть в статусе Up.

---

## 12. Полезные команды

| Действие | Команда |
|----------|--------|
| Логи приложения | `docker logs -f vidpravki` |
| Перезапуск | `docker compose -f docker-compose.standalone.yaml restart` |
| Пересборка после изменений кода | `docker compose -f docker-compose.standalone.yaml build --no-cache && docker compose -f docker-compose.standalone.yaml up -d` |
| Проверка Nginx | `sudo nginx -t` |
| Перезагрузка Nginx | `sudo systemctl reload nginx` |
| Статус Nginx | `sudo systemctl status nginx` |

---

## 13. Краткий чеклист с нуля

1. Сервер: Ubuntu 22.04, `apt update && apt upgrade`, установить `curl`, `git`.
2. Установить Docker и Docker Compose.
3. Склонировать/скопировать проект в `/opt/vidpravki`.
4. Создать и заполнить `.env` (SECRET_KEY, ADMIN_PASSWORD, при HTTPS — SESSION_COOKIE_SECURE=True).
5. Запустить: `docker compose -f docker-compose.standalone.yaml up -d`.
6. Установить Nginx, создать конфиг в `sites-available`, включить сайт, проверить `nginx -t`, перезагрузить nginx.
7. При необходимости: Certbot для HTTPS, обновить `.env`, перезапустить контейнер.
8. При необходимости: настроить UFW (80, 443, 22).

После этого сайт доступен по домену через Nginx; приложение работает в Docker на порту 3914, данные хранятся в `./data`.
