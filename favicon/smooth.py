from PIL import Image
import numpy as np
from sklearn.cluster import KMeans

# --- Cargar imagen ---
img_path = "/home/ramon.romero/workspace/personal/world-cup-championship/favicon/output_black_bg.png"
img = Image.open(img_path).convert("RGB")
data = np.array(img)

h, w, _ = data.shape

# --- Crear máscara: excluir fondo negro ---
# (ajustable si tu negro no es puro)
bg_threshold = 30
non_black_mask = np.any(data > bg_threshold, axis=2)

# --- Extraer solo píxeles del objeto (sin fondo) ---
pixels = data[non_black_mask]

# --- KMeans solo sobre el logo ---
kmeans = KMeans(n_clusters=2, n_init=10, random_state=0)
kmeans.fit(pixels)

colors = kmeans.cluster_centers_.astype(np.uint8)

print("Colores detectados (sin fondo):")
print(colors)

# --- Crear imagen final ---
result = data.copy()

# Asignar cada pixel del logo al color más cercano
labels = kmeans.predict(pixels)
result_pixels = colors[labels]

# Reinsertar en la imagen
result[non_black_mask] = result_pixels

# --- Guardar ---
out_path = "/home/ramon.romero/workspace/personal/world-cup-championship/favicon/output_clean_2colors.png"
Image.fromarray(result).save(out_path)

print(f"Imagen guardada en: {out_path}")
