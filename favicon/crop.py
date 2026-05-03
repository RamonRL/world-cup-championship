from PIL import Image
import numpy as np

# --- Ruta de la imagen ---
img_path = "/home/ramon.romero/workspace/personal/world-cup-championship/favicon/output_smooth.png"

img = Image.open(img_path).convert("RGB")
data = np.array(img)

# --- Detectar fondo negro ---
# (ajusta si tu negro no es perfecto)
bg_threshold = 20
mask = np.any(data > bg_threshold, axis=2)  # True = contenido (logo)

# --- Evitar error si la imagen es todo fondo ---
coords = np.column_stack(np.where(mask))

if coords.size == 0:
    raise ValueError("No se detectó contenido (imagen totalmente negra o umbral incorrecto)")

# --- Bounding box ---
y_min, x_min = coords.min(axis=0)
y_max, x_max = coords.max(axis=0)

# --- Crop ---
cropped = img.crop((x_min, y_min, x_max + 1, y_max + 1))

# --- Guardar ---
out_path = "/home/ramon.romero/workspace/personal/world-cup-championship/favicon/cropped.png"
cropped.save(out_path)

print(f"✔ Imagen recortada guardada en: {out_path}")
