export function buildPrompt(mode: string, body: string) {
  const prelude = `Render the INPUT PHOTO as a single, continuous frame of ONE subject.
Do NOT create a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame.
Do NOT duplicate, mirror, overlay, or repeat any part of the face or body.
Preserve identity exactly: same gender, skin tone, ethnicity, age, and facial structure.`;
  const ghibliFace = `Apply changes on the FACE ONLY; hair, body, clothing, and background remain photorealistic and unchanged.
Allow light, face-only anime micro-stylization (catchlights/tiny highlights). Avoid outlines and cel-shading. No skin recolor.`;

  const prefix = mode === 'ghiblireact' ? `${prelude}\n${ghibliFace}` : prelude;
  return `${prefix}\n${body || ''}`.trim();
}
