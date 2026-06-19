"""Genera imagenes de prueba para el seed de IA matching.

Crea 2 pares (perdida/encontrada) con variacion visual controlada
y mide la distancia perceptual de imagehash. El objetivo es que la
distancia sea <= 8 (lo que produce >= 60% de similitud y por
ende dispara el match en el backend).

Salida: backend/seed_assets/{a,b}_*.jpg
"""

import io
import random
from pathlib import Path

import imagehash
from PIL import Image, ImageDraw, ImageEnhance

OUT_DIR = Path(__file__).parent / "seed_assets"
OUT_DIR.mkdir(exist_ok=True)

random.seed(42)  # reproducibilidad

# Tamaño: el hasher reduce a 8x8. Cualquier tamano >= 64 funciona.
SIZE = 256


def make_blob(seed: int, base_color: tuple[int, int, int], accent: tuple[int, int, int]) -> Image.Image:
    """Genera una imagen sintetica con un blob distintivo."""
    rng = random.Random(seed)
    img = Image.new("RGB", (SIZE, SIZE), color=(rng.randint(220, 250),) * 3)
    draw = ImageDraw.Draw(img)

    # Forma irregular base
    cx, cy = SIZE // 2 + rng.randint(-20, 20), SIZE // 2 + rng.randint(-20, 20)
    radius = 90 + rng.randint(-10, 10)
    points = []
    for angle in range(0, 360, 20):
        a = angle * 3.14159 / 180
        r = radius + rng.randint(-15, 15)
        points.append((cx + r * 1.2 * (a if False else 0), cy + r * (a if False else 0)))
    # Forma organica con ellipse irregular
    for i in range(4):
        offset_x = rng.randint(-30, 30)
        offset_y = rng.randint(-30, 30)
        rx = radius + rng.randint(-15, 15)
        ry = radius + rng.randint(-15, 15)
        draw.ellipse(
            (cx - rx + offset_x, cy - ry + offset_y, cx + rx + offset_x, cy + ry + offset_y),
            fill=base_color,
        )

    # Patron distintivo (raya diagonal) -- ancla del hash
    for i in range(3):
        x1 = rng.randint(20, SIZE - 20)
        y1 = rng.randint(20, SIZE - 20)
        x2 = x1 + rng.randint(40, 100)
        y2 = y1 + rng.randint(40, 100)
        draw.line([(x1, y1), (x2, y2)], fill=accent, width=rng.randint(8, 18))

    # Punto brillante
    draw.ellipse((cx - 20, cy - 20, cx + 20, cy + 20), fill=accent)

    return img


def vary(img: Image.Image, seed: int) -> Image.Image:
    """Aplica variaciones aleatorias controladas que mantienen similitud perceptual."""
    rng = random.Random(seed)

    # 1. Brillo +/- 10% (mas suave que antes)
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.0 + rng.uniform(-0.1, 0.1))

    # 2. Contraste +/- 10%
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.0 + rng.uniform(-0.1, 0.1))

    # 3. Color +/- 5% (muy sutil)
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.0 + rng.uniform(-0.05, 0.05))

    # 4. Crop central al 95% (descartar muy poco borde)
    w, h = img.size
    margin_w, margin_h = int(w * 0.025), int(h * 0.025)
    img = img.crop((margin_w, margin_h, w - margin_w, h - margin_h))
    img = img.resize((w, h))

    return img


def hash_distance(img_a: Image.Image, img_b: Image.Image) -> int:
    ha = imagehash.average_hash(img_a)
    hb = imagehash.average_hash(img_b)
    return ha - hb


def score(distance: int) -> float:
    return max(0.0, 100.0 - distance * 5.0)


# Par A: perro amarillo (labrador)
color_a = (210, 170, 60)
accent_a = (50, 30, 10)
img_a1 = make_blob(1, color_a, accent_a)
img_a2 = vary(make_blob(1, color_a, accent_a), 7)

# Par B: gato naranja (persa)
color_b = (230, 130, 50)
accent_b = (40, 20, 5)
img_b1 = make_blob(2, color_b, accent_b)
img_b2 = vary(make_blob(2, color_b, accent_b), 8)

# Guardar
img_a1.save(OUT_DIR / "a1.jpg", quality=88)
img_a2.save(OUT_DIR / "a2.jpg", quality=85)
img_b1.save(OUT_DIR / "b1.jpg", quality=88)
img_b2.save(OUT_DIR / "b2.jpg", quality=85)

# Medir
d_a = hash_distance(img_a1, img_a2)
d_b = hash_distance(img_b1, img_b2)
# Cross-check: A vs B no debe matchear
d_cross = hash_distance(img_a1, img_b1)

print(f"Par A (perdida vs encontrada):  distancia={d_a}  similitud={score(d_a):.1f}%")
print(f"Par B (perdida vs encontrada):  distancia={d_b}  similitud={score(d_b):.1f}%")
print(f"Cross-check (A1 vs B1):         distancia={d_cross}  similitud={score(d_cross):.1f}%")
print(f"\nArchivos en {OUT_DIR}:")
for p in sorted(OUT_DIR.iterdir()):
    print(f"  {p.name}  {p.stat().st_size} bytes")
