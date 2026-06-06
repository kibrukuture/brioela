// SkSL shader for the ember glow.
// Renders a soft organic breathing ember on a black field.
// iTime drives the breathe cycle. iResolution normalizes coords.
// iIntensity controls how alive/bright the ember is (0.0 → 1.0).

export const EMBER_SHADER = `
uniform float2 iResolution;
uniform float  iTime;
uniform float  iIntensity;

// smooth noise
float hash(float2 p) {
  p = fract(p * float2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + float2(0,0)), hash(i + float2(1,0)), u.x),
    mix(hash(i + float2(0,1)), hash(i + float2(1,1)), u.x),
    u.y
  );
}

half4 main(float2 fragCoord) {
  float2 uv = (fragCoord - iResolution * 0.5) / min(iResolution.x, iResolution.y);

  // slow breathe — ember pulses gently
  float breathe = 0.82 + 0.18 * sin(iTime * 1.1 + 0.4);

  // ember core radius
  float radius = 0.055 * breathe * iIntensity;

  // distance from center with slight vertical offset (ember sits low-center)
  float2 center = float2(0.0, 0.06);
  float dist = length(uv - center);

  // organic noise displacement so edges are not perfectly round
  float angle = atan(uv.y - center.y, uv.x - center.x);
  float n = noise(float2(cos(angle) * 3.0, sin(angle) * 3.0) + iTime * 0.3);
  float displaced = dist - n * 0.012 * iIntensity;

  // core glow — amber / deep orange
  float core = smoothstep(radius, 0.0, displaced);

  // outer halo — wider, dimmer, warmer
  float halo = smoothstep(radius * 5.5, 0.0, displaced) * 0.18 * breathe * iIntensity;

  // tiny sparks — random high-frequency noise above the ember
  float2 sparkUv = uv - center + float2(0.0, -0.04);
  float sparks = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float2 sp = sparkUv + float2(
      sin(iTime * (1.7 + fi * 0.6) + fi * 2.1) * 0.018,
      -iTime * (0.03 + fi * 0.008) + fi * 0.011
    );
    float sd = length(sp) * (18.0 + fi * 4.0);
    sparks += smoothstep(1.0, 0.0, sd) * 0.25 * iIntensity;
  }
  sparks = fract(sparks);

  // color — ember orange to honey gold
  half3 emberColor   = half3(1.0,  0.38, 0.04);  // deep amber
  half3 haloColor    = half3(0.9,  0.22, 0.02);  // darker orange halo
  half3 sparkColor   = half3(1.0,  0.72, 0.18);  // honey gold sparks

  half3 col = haloColor * halo
            + emberColor * core
            + sparkColor * sparks * 0.6;

  // very faint warm radial ground glow so black feels warm not cold
  float groundGlow = smoothstep(0.35, 0.0, dist) * 0.04 * iIntensity;
  col += half3(0.6, 0.15, 0.02) * groundGlow;

  return half4(col, 1.0);
}
`;
