/**
 * Carga las fuentes (Inter regular + black) desde Google Fonts en runtime
 * para inyectarlas en `ImageResponse`. Sin esto Satori usa una fallback
 * sin métricas correctas y los layouts con `fontWeight: 800` o
 * `lineHeight: 0.95` salen torcidos / solapados.
 *
 * Resultado: array listo para pasar a `new ImageResponse(..., { fonts })`.
 */
async function fetchFont(weight: 400 | 700 | 900): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`;
  const css = await fetch(url, {
    headers: {
      // User-Agent moderno para que Google sirva woff2.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36",
    },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:woff2|truetype)'\)/);
  if (!match) throw new Error("No pude extraer URL de la fuente Inter");
  const fontUrl = match[1];
  const buf = await fetch(fontUrl).then((r) => r.arrayBuffer());
  return buf;
}

export async function ogFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: "normal" }[]
> {
  const [regular, bold, black] = await Promise.all([
    fetchFont(400),
    fetchFont(700),
    fetchFont(900),
  ]);
  return [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
    { name: "Inter", data: black, weight: 900, style: "normal" },
  ];
}
