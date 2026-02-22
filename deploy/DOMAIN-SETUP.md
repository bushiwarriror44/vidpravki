# Настройка домена wth41.biz (Cloudflare + Nginx)

## 1. Cloudflare (DNS и SSL)

1. **DNS**
   - Запись **A**: имя `@`, значение `185.43.222.245`, Proxy включён (оранжевое облако).
   - Запись **A** или **CNAME**: имя `www`, значение `wth41.biz` (или `185.43.222.245`), Proxy включён.

2. **SSL/TLS**
   - Режим: **Flexible** (посетитель — HTTPS, между Cloudflare и сервером — HTTP).
   - Тогда на сервере достаточно только порта 80.

## 2. Сервер (Ubuntu/Debian)

### 2.1. Установка Nginx (если ещё не установлен)

```bash
sudo apt update
sudo apt install -y nginx
```

### 2.2. Копирование конфига

Из папки проекта:

```bash
cd /path/to/vidpravki
sudo cp deploy/nginx-wth41.biz.conf /etc/nginx/sites-available/wth41.biz.conf
sudo ln -sf /etc/nginx/sites-available/wth41.biz.conf /etc/nginx/sites-enabled/
```

Или создать конфиг вручную:

```bash
sudo nano /etc/nginx/sites-available/wth41.biz.conf
```

Вставить содержимое из `deploy/nginx-wth41.biz.conf`, сохранить.

### 2.3. Отключить конфликтующий default (если слушает 80)

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

### 2.4. Проверка и перезапуск Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2.5. Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
sudo ufw enable
```

## 3. Проверка

- Открыть в браузере: `https://wth41.biz` и `https://www.wth41.biz`.
- Сайт должен открываться по домену; при Flexible SSL в адресной строке будет HTTPS.

## 4. Сертификат для домена (HTTPS на сервере)

### Вариант A: Certbot вручную (standalone)

Сертификат получается без правки конфига Nginx; порт 80 на время выдачи должен быть свободен.

```bash
sudo systemctl stop nginx
sudo apt install -y certbot
sudo certbot certonly --standalone -d wth41.biz -d www.wth41.biz --agree-tos -m your@email.com --no-eff-email
sudo systemctl start nginx
```

Файлы появятся здесь:

- Сертификат: `/etc/letsencrypt/live/wth41.biz/fullchain.pem`
- Ключ: `/etc/letsencrypt/live/wth41.biz/privkey.pem`

После этого используй конфиг с блоком `listen 443 ssl` (как в `deploy/nginx-wth41.biz.conf`) и путями выше.

### Вариант B: Certbot с плагином Nginx

Nginx уже должен слушать домен на 80. Certbot сам добавит HTTPS и пути к сертификатам:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wth41.biz -d www.wth41.biz --agree-tos -m your@email.com --no-eff-email
```

### Вариант C: Certbot через webroot (Nginx не останавливать)

Сначала в конфиге Nginx для порта 80 должна быть директива:

```nginx
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

Создать каталог и получить сертификат:

```bash
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d wth41.biz -d www.wth41.biz --agree-tos -m your@email.com --no-eff-email
```

Дальше вручную добавить в Nginx блок `server { listen 443 ssl; ... }` с путями к `fullchain.pem` и `privkey.pem`.

### Продление (Let's Encrypt)

Сертификат действует 90 дней. Проверка авто-продления:

```bash
sudo certbot renew --dry-run
```

Обычно в системе уже есть таймер/крон для `certbot renew`; после продления достаточно перезагрузить Nginx: `sudo systemctl reload nginx`.

### Cloudflare

После установки сертификата на сервере в Cloudflare можно переключить SSL/TLS на **Full** или **Full (Strict)**.
