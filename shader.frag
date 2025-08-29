// ----- Helpers -----
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// rounded box with corner radius r
float sdRoundedBox(vec2 p, vec2 b, float r) {
    return sdBox(p, b - vec2(r)) - r;
}

// equilateral triangle centered at origin, pointing up
float sdEquilateralTriangle(vec2 p, float size) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - size;
    p.y = p.y + size / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * size, 0.0);
    return -length(p) * sign(p.y);
}

// regular N-gon (centered) SDF
float sdRegularPolygon(vec2 p, int n, float radius) {
    float a = atan(p.y, p.x);
    float r = length(p);
    float sector = 2.0 * 3.14159265359 / float(n);
    float half = sector * 0.5;
    float d = cos(floor((a + half) / sector) * sector - a) * r - radius * cos(half);
    // approximate: positive outside
    return d;
}

// star shaped (spiky) SDF: n points, innerRadius relative to outerRadius
float sdStar(vec2 p, int n, float innerR, float outerR) {
    float a = atan(p.y, p.x);
    float r = length(p);
    float sector = 3.14159265359 * 2.0 / float(n);
    float m = mod(a + 3.14159265359/float(n), sector) - sector*0.5;
    float q = cos(m) * r;
    // blend between inner and outer using a simple sawtooth
    float t = (cos(float(n) * a) + 1.0) * 0.5;
    float ref = mix(innerR, outerR, t);
    return q - ref;
}

// rounded diamond (rotated square) via rotated rounded box
float sdDiamond(vec2 p, vec2 b, float r) {
    // rotate 45deg
    float c = 0.70710678118; // cos45
    mat2 R = mat2(c, -c, c, c);
    vec2 q = R * p;
    return sdRoundedBox(q, b, r);
}

// heart SDF (approx)
float sdHeart(vec2 p, vec2 size) {
    // scale to canonical heart
    p /= size;
    p.x *= 1.0;
    p.y *= 1.0;
    p.y += 0.25;
    float a = atan(p.x, p.y) ;
    float r = length(p);
    // implicit heart curve approximation
    float h = (pow(r, 2.0) - 0.5 * pow(sin(a), 2.0));
    return h * min(size.x, size.y);
}

// wavy circle (cookie) - create radial perturbation
float sdWavyCircle(vec2 p, float baseR, int waves, float amplitude) {
    float a = atan(p.y, p.x);
    float r = length(p);
    float w = sin(float(waves) * a) * amplitude;
    return r - (baseR + w);
}

// clover 4-leaf: union of 4 circles
float sdClover4(vec2 p, float radius) {
    float d1 = sdCircle(p - vec2(0.0, radius * 0.5), radius);
    float d2 = sdCircle(p - vec2( radius * 0.5, 0.0), radius);
    float d3 = sdCircle(p - vec2(0.0, -radius * 0.5), radius);
    float d4 = sdCircle(p - vec2(-radius * 0.5, 0.0), radius);
    float d = min(min(d1,d2), min(d3,d4));
    return d;
}

// ghost-ish: main circle top + scalloped bottom
float sdGhostish(vec2 p, float radius) {
    // top cap
    float top = sdCircle(p - vec2(0.0, -0.1 * radius), 0.95 * radius);
    // bottom scallops (3 semicircles)
    float s1 = sdCircle(p - vec2(-0.35*radius, 0.45*radius), 0.25*radius);
    float s2 = sdCircle(p - vec2(0.0, 0.45*radius), 0.25*radius);
    float s3 = sdCircle(p - vec2(0.35*radius, 0.45*radius), 0.25*radius);
    // combine: subtract scallops from base circle (approx via max of negative)
    float scallops = min(min(s1, s2), s3);
    // create union-like shape: take max of top and -scallops to punch holes
    float g = min(top, -scallops);
    return g;
}

// arrow (triangle head + shaft rectangle)
float sdArrow(vec2 p, vec2 size, float headSize) {
    // assume arrow pointing up
    // head: triangle
    vec2 ph = p - vec2(0.0, size.y*0.25);
    float head = sdEquilateralTriangle(ph - vec2(0.0, size.y*0.25), headSize);
    // shaft: rounded box
    vec2 shaftP = p - vec2(0.0, -size.y*0.2);
    float shaft = sdRoundedBox(shaftP, vec2(size.x*0.12, size.y*0.35), 0.02);
    return min(head, shaft);
}

// slanted rectangle: rotate box
float sdSlantedRect(vec2 p, vec2 b, float angle, float r) {
    float c = cos(angle), s = sin(angle);
    mat2 R = mat2(c, -s, s, c);
    vec2 q = R * p;
    return sdRoundedBox(q, b, r);
}

// fan/arch approximations: use sector clipping of circle
float sdSectorCircle(vec2 p, float r, float startAngle, float sweep) {
    float a = atan(p.y, p.x);
    float half = sweep*0.5;
    float center = startAngle + half;
    float rel = a - center;
    // clamp angle
    if (abs(rel) > half) {
        // outside angular wedge -> distance to wedge edge (approx)
        vec2 dir = vec2(cos(startAngle), sin(startAngle));
        float edge = dot(p, dir);
        return max(length(p) - r, abs(rel) - half) + edge*0.0;
    }
    return length(p) - r;
}

// semi circle SDF: circle clipped with half-plane
float sdSemiCircle(vec2 p, float r, float dirY) {
    float d = sdCircle(p, r);
    float plane = dirY * p.y - 0.0; // keep y>=0 if dirY=1
    return max(d, -plane);
}

// oval
float sdOval(vec2 p, vec2 r) {
    // scale p so circle SDF works
    vec2 q = p / r;
    return length(q) - 1.0;
}

// pill (capsule) aligned horizontally
float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, pb = p - b;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

// generic anti-aliased color from an SDF
vec4 sdfColor(float d, vec3 color, float stroke, float smoothing) {
    // d is signed distance: negative inside, positive outside
    // stroke>0 -> produce ring: abs(d)-stroke/2
    float halfStroke = stroke * 0.5;
    float dist = (stroke > 0.0) ? abs(d) - halfStroke : d;
    // smoothing uses derivatives for AA
    float w = smoothing;
    float a = 1.0 - smoothstep(-w, w, dist);
    return vec4(color, a);
}

// convenience wrapper to compute smoothing based on derivatives
float smoothingFromD(float d) {
    // fwidth(d) often used; if not available, use small constant
#ifdef GL_OES_standard_derivatives
    return max(0.5 * fwidth(d), 0.001);
#else
    return 0.002;
#endif
}

// ----- Public wrappers (normalized coordinates [0..1]) -----
// Each wrapper expects p in [0..1]. It recenters to origin (-0.5..0.5) internally.

// Circle
vec4 Circle(vec2 p, vec2 center, float radius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0; // now roughly [-1..1]
    float d = sdCircle(q, radius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Square (rounded)
vec4 Square(vec2 p, vec2 center, vec2 size, float cornerRadius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdRoundedBox(q, size, cornerRadius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Slanted
vec4 Slanted(vec2 p, vec2 center, vec2 size, float angleDegrees, float cornerRadius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float a = radians(angleDegrees);
    float d = sdSlantedRect(q, size, a, cornerRadius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Triangle
vec4 Triangle(vec2 p, vec2 center, float size, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdEquilateralTriangle(q, size);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Diamond
vec4 Diamond(vec2 p, vec2 center, vec2 size, float cornerRadius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdDiamond(q, size, cornerRadius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Pentagon (regular polygon wrapper)
vec4 Pentagon(vec2 p, vec2 center, float radius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdRegularPolygon(q, 5, radius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Gem (approximated as inset diamond + facets)
vec4 Gem(vec2 p, vec2 center, float radius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    // approximate gem by intersecting two diamonds rotated
    float d1 = sdDiamond(q, vec2(radius*0.8, radius*1.0), 0.05);
    mat2 R = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678);
    float d2 = sdDiamond(R*q, vec2(radius*0.6, radius*0.9), 0.05);
    float d = max(d1, d2); // intersection look
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Sunny (star)
vec4 Sunny(vec2 p, vec2 center, float outerR, int spikes, float innerRFactor, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdStar(q, spikes, innerRFactor * outerR, outerR);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// SemiCircle
vec4 SemiCircle(vec2 p, vec2 center, float r, float dirY, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdSemiCircle(q, r, dirY);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Oval
vec4 Oval(vec2 p, vec2 center, vec2 radii, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdOval(q, radii);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Pill (capsule)
vec4 Pill(vec2 p, vec2 center, vec2 a, vec2 b, float r, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdCapsule(q, a, b, r);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Ghostish
vec4 Ghostish(vec2 p, vec2 center, float radius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdGhostish(q, radius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Cookie (wavy circle) - n sided cookie via wavy circle
vec4 CookieN(vec2 p, vec2 center, float baseRadius, int waves, float amplitude, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdWavyCircle(q, baseRadius, waves, amplitude);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Clover 4 leaf
vec4 Clover4Leaf(vec2 p, vec2 center, float radius, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdClover4(q, radius);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Arrow
vec4 Arrow(vec2 p, vec2 center, vec2 size, float headSize, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdArrow(q, size, headSize);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Fan (approximated as sector)
vec4 Fan(vec2 p, vec2 center, float radius, float startAngleDeg, float sweepDeg, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float startA = radians(startAngleDeg);
    float sweep = radians(sweepDeg);
    float d = sdSectorCircle(q, radius, startA, sweep);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Arch (approximated by sector with big rounding)
vec4 Arch(vec2 p, vec2 center, float radius, float thickness, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float outer = sdCircle(q, radius);
    float inner = sdCircle(q, radius - thickness);
    float d = max(outer, -inner); // ring
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}

// Heart
vec4 Heart(vec2 p, vec2 center, vec2 size, vec3 color, float stroke) {
    vec2 q = (p - center) * 2.0;
    float d = sdHeart(q, size);
    float s = smoothingFromD(d);
    return sdfColor(d, color, stroke, s);
}
