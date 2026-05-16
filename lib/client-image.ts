/**
 * Utilidades cliente para procesar imágenes antes de subirlas. Sólo
 * funcionan en navegador (Canvas + createImageBitmap). NO importar desde
 * server components.
 */

export type CompressOptions = {
  /** Lado más largo después de redimensionar. Default 800px. */
  maxDim?: number;
  /** Calidad JPEG entre 0 y 1. Default 0.85. */
  quality?: number;
  /**
   * Si la imagen original ya es menor que `maxDim` Y pesa menos que este
   * umbral, devolvemos el original tal cual sin re-codificar. Default 200kb.
   */
  skipIfUnderBytes?: number;
};

export type CompressResult = {
  file: File;
  originalBytes: number;
  finalBytes: number;
  width: number;
  height: number;
  /** True si la función decidió no re-codificar (original ya optimizado). */
  skipped: boolean;
};

/**
 * Recibe un File de imagen, lo redimensiona a `maxDim` por lado largo
 * manteniendo proporción, lo re-codifica a JPEG con `quality` y devuelve
 * un File nuevo. Respeta orientación EXIF en navegadores modernos vía
 * `createImageBitmap({ imageOrientation: "from-image" })`.
 *
 * Pensado para fotos de perfil: una foto de 4 MB de un móvil acaba en
 * ~80-200 KB sin pérdida perceptible al tamaño de avatar.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { maxDim = 800, quality = 0.85, skipIfUnderBytes = 200 * 1024 } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen.");
  }

  // createImageBitmap es el camino moderno: decodifica fuera del hilo
  // principal y respeta EXIF si pedimos `imageOrientation: "from-image"`.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback para navegadores antiguos: cargar vía <img>. No respeta EXIF
    // pero al menos no rompe.
    bitmap = await fallbackBitmap(file);
  }

  const { width: srcW, height: srcH } = bitmap;
  const longest = Math.max(srcW, srcH);
  const needsResize = longest > maxDim;

  // Atajo: si la original ya es chica y pesa poco, no re-codificamos.
  // Re-codificar una imagen pequeña tiende a perder calidad sin ganar tamaño.
  if (!needsResize && file.size < skipIfUnderBytes) {
    bitmap.close();
    return {
      file,
      originalBytes: file.size,
      finalBytes: file.size,
      width: srcW,
      height: srcH,
      skipped: true,
    };
  }

  const scale = needsResize ? maxDim / longest : 1;
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Tu navegador no soporta Canvas para optimizar la imagen.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("No fue posible optimizar la imagen.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";
  const compressed = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: compressed,
    originalBytes: file.size,
    finalBytes: compressed.size,
    width,
    height,
    skipped: false,
  };
}

async function fallbackBitmap(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo decodificar la imagen."));
      img.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Formatea bytes como "X.X MB" o "X KB" para mensajes UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
