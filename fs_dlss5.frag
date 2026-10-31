#version 450
// fs_dlss5.frag -- DLSS-5-like look (approximation, NOT neural rendering).
// UV comes from gl_FragCoord, so it works with your existing vertex shader
// regardless of which varyings it outputs.
layout(location = 0) out vec4 outColor;
layout(set = 0, binding = 0) uniform sampler2D uSrc;

// 44 bytes; must match the float pc[11] in postfx.cpp
layout(push_constant) uniform PC {
    vec2  texel;     // 1/width, 1/height
    float ao;        // pseudo ambient occlusion
    float clarity;   // local contrast
    float lift;      // shadow fill light
    float sheen;     // specular sheen
    float warmth;    // warm highlights / cool shadows
    float bloomAmt;  // glow
    float sat;       // saturation (1 = unchanged)
    float strength;  // master mix (0 = off)
    float srgb;      // 1 if swapchain format is *_SRGB
} pc;

vec3 fetch(vec2 uv) {
    vec3 c = texture(uSrc, uv).rgb;
    return pc.srgb > 0.5 ? pow(c, vec3(1.0 / 2.2)) : c;   // work in display-referred space
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

const vec2 RING[8] = vec2[8](
    vec2( 1.0, 0.0), vec2( 0.7071, 0.7071), vec2(0.0, 1.0), vec2(-0.7071, 0.7071),
    vec2(-1.0, 0.0), vec2(-0.7071,-0.7071), vec2(0.0,-1.0), vec2( 0.7071,-0.7071));

float blurLuma(vec2 uv, float r, float centre) {
    float s = centre;
    for (int i = 0; i < 8; i++) s += luma(fetch(uv + RING[i] * r * pc.texel));
    return s / 9.0;
}
vec3 blurColor(vec2 uv, float r, vec3 centre) {
    vec3 s = centre;
    for (int i = 0; i < 8; i++) s += fetch(uv + RING[i] * r * pc.texel);
    return s / 9.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy * pc.texel;
    vec3 src = fetch(uv);
    vec3 c = src;
    float L = luma(src);

    // 1) clarity: local contrast vs mid-size neighbourhood
    float mid = blurLuma(uv, 6.0, L);
    c *= 1.0 + (L - mid) * 2.2 * pc.clarity;

    // 2) pseudo-AO: darker than wide neighbourhood = crevice
    float wide = blurLuma(uv, 20.0, L);
    c *= 1.0 - clamp((wide - L) * 2.0, 0.0, 0.35) * pc.ao;

    // 3) shadow lift
    c += pow(1.0 - luma(c), 3.0) * 0.07 * pc.lift;

    // 4) specular sheen on bright detail
    c += max(L - mid, 0.0) * step(0.55, L) * 1.6 * pc.sheen;

    // 5) warm highlights / cool shadows
    float lc = luma(c);
    c.r += 0.05 * lc * pc.warmth;
    c.b -= 0.04 * lc * pc.warmth;
    c.b += 0.03 * (1.0 - clamp(lc * 1.8, 0.0, 1.0)) * pc.warmth;

    // 6) saturation
    c = mix(vec3(luma(c)), c, pc.sat);

    // 7) bloom
    vec3 b = blurColor(uv, 14.0, src);
    c = 1.0 - (1.0 - c) * (1.0 - clamp(b - 0.6, 0.0, 1.0) * 0.5 * pc.bloomAmt);

    // 8) gentle filmic curve
    c = clamp(c, 0.0, 1.0);
    c = c * c * (3.0 - 2.0 * c) * 0.4 + c * 0.6;

    c = mix(src, c, pc.strength);
    if (pc.srgb > 0.5) c = pow(c, vec3(2.2));
    outColor = vec4(c, 1.0);
}
