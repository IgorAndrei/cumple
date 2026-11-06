# micumple.zenti.cl

Página sorpresa de cumpleaños: un regalo que se abre, una nota y una tarjeta para raspar que revela las entradas a Hilary Duff (20 de agosto de 2027).

- Antes del **25 de noviembre de 2026** muestra "Todavía no" con una cuenta regresiva.
- Para probarla antes: `https://micumple.zenti.cl/?probar`

## Personalizar

En `public/index.html`, al inicio del `<script>`:

```js
const NOMBRE = "mi amor";
const DE = "Igor";
const LUGAR = "";
const CONCIERTO = new Date(2027, 7, 20, 21, 0, 0);
const ABRE = new Date(2026, 10, 25, 0, 0, 0);
```

El mensaje de la nota está en `<p id="msg">`.

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
