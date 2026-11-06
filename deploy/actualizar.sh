#!/usr/bin/env bash
# Trae los últimos cambios del repo. Ejecutar con: sudo bash /var/www/micumple/deploy/actualizar.sh
set -euo pipefail
git -C /var/www/micumple pull --ff-only
chown -R www-data:www-data /var/www/micumple
echo "Actualizado."
