#!/usr/bin/env bash
# Instala el mini servidor (videos, avisos y fotos). Ejecutar con: sudo bash /var/www/micumple/deploy/instalar-api.sh
set -euo pipefail
DESTINO="/var/www/micumple"
SITIO="/etc/nginx/sites-available/micumple.zenti.cl"

if ! command -v node >/dev/null; then
  apt-get install -y nodejs
fi
echo "Node: $(node -v)"

# Clave del panel y canal de avisos (se crean una sola vez)
if [ ! -f /etc/micumple.env ]; then
  echo "PANEL_CLAVE=$(openssl rand -hex 8)" > /etc/micumple.env
  echo "NTFY_TOPIC=micumple-$(openssl rand -hex 6)" >> /etc/micumple.env
  chmod 640 /etc/micumple.env
  chgrp www-data /etc/micumple.env
fi

mkdir -p "$DESTINO/data/videos" "$DESTINO/public/fotos"
chown -R www-data:www-data "$DESTINO"

# Servicio
cp "$DESTINO/deploy/micumple.service" /etc/systemd/system/micumple.service
systemctl daemon-reload
systemctl enable --now micumple
systemctl restart micumple

# Nginx: agrega las rutas /api y /panel al sitio (sin tocar lo que puso certbot)
cp "$DESTINO/deploy/micumple-api.conf" /etc/nginx/snippets/micumple-api.conf
if ! grep -q "micumple-api.conf" "$SITIO"; then
  sed -i 's|^\(\s*\)server_name micumple.zenti.cl;|&\n\1include snippets/micumple-api.conf;|' "$SITIO"
fi
nginx -t
systemctl reload nginx

source /etc/micumple.env
echo
echo "=============================================="
echo " Panel (guárdalo, es secreto):"
echo "   https://micumple.zenti.cl/panel?clave=$PANEL_CLAVE"
echo
echo " Avisos al celular: instala la app 'ntfy' y suscríbete a:"
echo "   $NTFY_TOPIC"
echo "=============================================="
