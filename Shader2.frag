// =============================================================
// Compact SDF Shapes Library
// Each shape: float Shape(vec2 uv, vec2 center, float size, float blur)
// uv: screen position
// center: shape center
// size: shape size / radius
// blur: edge softness (AA control)
// returns: alpha mask in [0..1]
// =============================================================

float Circle(vec2 uv, vec2 center, float size, float blur) {
    float d = length(uv - center) - size;
    return 1.0 - smoothstep(-blur, blur, d);
}

float Square(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = (uv - center);
    vec2 d = abs(p) - vec2(size);
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    return 1.0 - smoothstep(-blur, blur, dist);
}

float Diamond(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = abs(uv - center);
    float d = (p.x + p.y) - size;
    return 1.0 - smoothstep(-blur, blur, d);
}

float Triangle(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = uv - center;
    const float k = sqrt(3.0);
    p.x = abs(p.x) - size;
    p.y = p.y + size / k;
    if (p.x + k*p.y > 0.0) p = vec2(p.x - k*p.y, -k*p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0*size, 0.0);
    float d = -length(p) * sign(p.y);
    return 1.0 - smoothstep(-blur, blur, d);
}

float Pentagon(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = uv - center;
    float a = atan(p.y, p.x);
    float r = length(p);
    float sector = 2.0 * 3.14159265 / 5.0;
    float half = sector * 0.5;
    float d = cos(floor((a + half) / sector) * sector - a) * r - size * cos(half);
    return 1.0 - smoothstep(-blur, blur, d);
}

float Star(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = uv - center;
    float a = atan(p.y, p.x);
    float r = length(p);
    float sector = 3.14159265 * 2.0 / 5.0;
    float m = mod(a + 3.14159265/5.0, sector) - sector*0.5;
    float q = cos(m) * r;
    float t = (cos(5.0*a) + 1.0) * 0.5;
    float ref = mix(size*0.5, size, t);
    float d = q - ref;
    return 1.0 - smoothstep(-blur, blur, d);
}

float SemiCircle(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = uv - center;
    float d = length(p) - size;
    d = max(d, -p.y);
    return 1.0 - smoothstep(-blur, blur, d);
}

float Oval(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = (uv - center) / vec2(size, size*0.6);
    float d = length(p) - 1.0;
    return 1.0 - smoothstep(-blur, blur, d);
}

float Pill(vec2 uv, vec2 center, float size, float blur) {
    vec2 a = center - vec2(size, 0.0);
    vec2 b = center + vec2(size, 0.0);
    vec2 pa = uv - a, pb = uv - b;
    vec2 ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    float d = length(pa - ba*h) - size*0.5;
    return 1.0 - smoothstep(-blur, blur, d);
}

float Heart(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = (uv - center) / size;
    p.y += 0.25;
    float a = atan(p.x, p.y);
    float r = length(p);
    float h = pow(r,2.0) - 0.5 * pow(sin(a),2.0);
    float d = h * size;
    return 1.0 - smoothstep(-blur, blur, d);
}

float Ghostish(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = uv - center;
    float top = length(p - vec2(0.0, -0.1*size)) - 0.95*size;
    float s1 = length(p - vec2(-0.35*size, 0.45*size)) - 0.25*size;
    float s2 = length(p - vec2(0.0, 0.45*size)) - 0.25*size;
    float s3 = length(p - vec2(0.35*size, 0.45*size)) - 0.25*size;
    float scallops = min(min(s1,s2), s3);
    float d = min(top, -scallops);
    return 1.0 - smoothstep(-blur, blur, d);
}

float Clover4(vec2 uv, vec2 center, float size, float blur) {
    vec2 p = uv - center;
    float d1 = length(p - vec2(0.0, size*0.5)) - size;
    float d2 = length(p - vec2(size*0.5, 0.0)) - size;
    float d3 = length(p - vec2(0.0, -size*0.5)) - size;
    float d4 = length(p - vec2(-size*0.5, 0.0)) - size;
    float d = min(min(d1,d2), min(d3,d4));
    return 1.0 - smoothstep(-blur, blur, d);
}
