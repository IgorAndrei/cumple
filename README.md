# micumple.zenti.cl

Página sorpresa de cumpleaños: un regalo que se abre, una nota y una tarjeta para raspar que revela las entradas a Hilary Duff (20 de agosto de 2027).

- Antes del **25 de noviembre de 2026** muestra "Todavía no" con una cuenta regresiva.
- Para probarla antes: `https://micumple.zenti.cl/?probar`

## Personalizar

En `public/index.html`, al inicio del `<script>`:

```js
const NOMBRE = "Isis";
const DE = "Andrei";
const LUGAR = "Santander Arena";
const CONCIERTO = new Date(2027, 7, 20, 21, 0, 0);
const ABRE = new Date(2026, 10, 25, 0, 0, 0);
```

El mensaje de la nota está en `<p id="msg">`.

## Música

Dos canciones, en loop:

- `public/musica.mp3`: suena desde el primer toque (canción neutra, para no delatar la sorpresa).
- `public/hilary.mp3`: reemplaza a la primera cuando se revela la entrada.

Los archivos no se suben al repo; se copian directo al servidor:

```bash
scp cancion.mp3 ubuntu@51.222.29.21:/tmp/musica.mp3
sudo mv /tmp/musica.mp3 /var/www/micumple/public/musica.mp3
```

(igual para `hilary.mp3`)

## Instalar en el VPS

1. DNS de zenti.cl: registro **A** `micumple` → `51.222.29.21`.
2. En el VPS:

```bash
git clone https://github.com/IgorAndrei/cumple.git ~/cumple && sudo bash ~/cumple/deploy/instalar.sh
```

## Actualizar

```bash
sudo bash /var/www/micumple/deploy/actualizar.sh
```

## Videos, avisos y fotos (mini servidor)

`server.js` (Node, sin dependencias) guarda el video de la reacción (solo si ella acepta la cámara), registra cuándo abre/revela/acepta, avisa al celular por [ntfy](https://ntfy.sh) y lista las fotos de `public/fotos/`.

Instalar una vez:

```bash
sudo bash /var/www/micumple/deploy/instalar-api.sh
```

Imprime la URL secreta del panel (`/panel?clave=...`) y el canal de ntfy al que suscribirte.

Fotos: copiar archivos .jpg/.png a `/var/www/micumple/public/fotos/` (se muestran en orden por nombre: 1.jpg, 2.jpg...).
Con `?probar` los eventos y videos quedan marcados como prueba.
