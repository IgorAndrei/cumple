#!/usr/bin/env bash
# Primera instalación en el VPS (Ubuntu 22.04). Ejecutar con: sudo bash deploy/instalar.sh
set -euo pipefail

DOMINIO="micumple.zenti.cl"
DESTINO="/var/www/micumple"
REPO="https://github.com/IgorAndrei/cumple.git"

apt-get update
apt-get install -y nginx git certbot python3-certbot-nginx

# Código
if [ -d "$DESTINO/.git" ]; then
  git -C "$DESTINO" pull --ff-only
else
  git clone "$REPO" "$DESTINO"
fi
chown -R www-data:www-data "$DESTINO"
git config --global --add safe.directory "$DESTINO"

# Nginx
cp "$DESTINO/deploy/nginx-micumple.conf" "/etc/nginx/sites-available/$DOMINIO"
ln -sf "/etc/nginx/sites-available/$DOMINIO" "/etc/nginx/sites-enabled/$DOMINIO"
nginx -t
systemctl reload nginx

# Firewall (si ufw está activo)
if ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full'
fi

# HTTPS (el registro DNS ya debe apuntar a este servidor)
certbot --nginx -d "$DOMINIO" --redirect --agree-tos --register-unsafely-without-email -n

echo "Listo: https://$DOMINIO"
