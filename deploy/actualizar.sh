#!/usr/bin/env bash
# Trae los últimos cambios del repo. Ejecutar con: sudo bash /var/www/micumple/deploy/actualizar.sh
set -euo pipefail
git -C /var/www/micumple pull --ff-only
chown -R www-data:www-data /var/www/micumple
if systemctl list-unit-files micumple.service >/dev/null 2>&1 && [ -f /etc/systemd/system/micumple.service ]; then
  cp /var/www/micumple/deploy/micumple-api.conf /etc/nginx/snippets/micumple-api.conf
  nginx -t && systemctl reload nginx
  systemctl restart micumple
fi
echo "Actualizado."
