from PIL import Image
import numpy as np

img = Image.open("/home/ramon.romero/Downloads/output2.png").convert("RGBA")
data = np.array(img)

r, g, b, a = data.T

# Detectar píxeles transparentes
transparent = a == 0

# Convertirlos a negro (y hacerlos opacos)
data[..., :-1][transparent.T] = (0, 0, 0)
data[..., -1][transparent.T] = 255

Image.fromarray(data).save("/home/ramon.romero/Downloads/output_black_bg.png")
