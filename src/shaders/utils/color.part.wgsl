fn unpackColor(packed: u32, alpha: f32) -> vec4<f32> {
    return vec4<f32>(
        f32(packed & 255u) / 255.0,
        f32((packed >> 8u) & 255u) / 255.0,
        f32((packed >> 16u) & 255u) / 255.0,
        alpha
    );
}

fn packColor(color: vec3<f32>) -> u32 {
    let colorUint = vec3<u32>(color * 255.0);

    return colorUint.r |
        (colorUint.g << 8u) |
        (colorUint.b << 16u);
}

fn colorFromHue(normalizedHue: f32, alpha: f32) -> vec4<f32> {
    let value = normalizedHue * 6.0;
    if (value < 1.0) {
        return vec4<f32>(1.0, value, 0.0, alpha);
    } elseif (value < 2.0) {
        return vec4<f32>(2.0 - value, 1.0, 0.0, alpha);
    } elseif (value < 3.0) {
        return vec4<f32>(0.0, 1.0, value - 2.0, alpha);
    } elseif (value < 4.0) {
        return vec4<f32>(0.0, 4.0 - value, 1.0, alpha);
    } elseif (value < 5.0) {
        return vec4<f32>(value - 4.0, 0.0, 1.0, alpha);
    }
    return vec4<f32>(1.0, 0.0, 6.0 - value, alpha);
}

fn colorFromVelocity(velocity: vec2<f32>, alpha: f32) -> vec4<f32> {
    let normalizedHue: f32 = 0.5 + 0.5 * atan2(velocity.y, velocity.x) / 3.14159;
    return colorFromHue(normalizedHue, alpha);
}
