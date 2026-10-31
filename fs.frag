#version 450
// original foxpostfx pass: sharpen / contrast / saturation / vignette
layout(location = 0) out vec4 outColor;
layout(set = 0, binding = 0) uniform sampler2D uSrc;
layout(push_constant) uniform PC { float sharpen; float contrast; float saturation; float vignette; } pc;

void main() {
    vec2 sz = vec2(textureSize(uSrc, 0));
    vec2 uv = gl_FragCoord.xy / sz;
    vec2 t = 1.0 / sz;
    vec3 c = texture(uSrc, uv).rgb;
    vec3 n = texture(uSrc, uv + vec2(t.x, 0.0)).rgb + texture(uSrc, uv - vec2(t.x, 0.0)).rgb
           + texture(uSrc, uv + vec2(0.0, t.y)).rgb + texture(uSrc, uv - vec2(0.0, t.y)).rgb;
    c += (c - n * 0.25) * pc.sharpen;
    c = (c - 0.5) * pc.contrast + 0.5;
    float g = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(g), c, pc.saturation);
    float d = length(uv - 0.5) * 1.41421356;
    c *= 1.0 - pc.vignette * smoothstep(0.3, 0.9, d);
    outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
