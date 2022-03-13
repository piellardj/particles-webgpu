fn unpackColor(packed: u32, alpha: f32) -> vec4<f32> {
    return vec4<f32>(unpack4x8unorm(packed).rgb, alpha);
}

fn packColor(color: vec3<f32>) -> u32 {
    return pack4x8unorm(vec4<f32>(color, 1.0));
}

fn colorFromHue(normalizedHue: f32, alpha: f32) -> vec4<f32> {
    let value = normalizedHue * 6.0;
    if (value < 1.0) {
        return vec4<f32>(1.0, value, 0.0, alpha);
    } else if (value < 2.0) {
        return vec4<f32>(2.0 - value, 1.0, 0.0, alpha);
    } else if (value < 3.0) {
        return vec4<f32>(0.0, 1.0, value - 2.0, alpha);
    } else if (value < 4.0) {
        return vec4<f32>(0.0, 4.0 - value, 1.0, alpha);
    } else if (value < 5.0) {
        return vec4<f32>(value - 4.0, 0.0, 1.0, alpha);
    }
    return vec4<f32>(1.0, 0.0, 6.0 - value, alpha);
}

fn colorFromVelocity(velocity: vec2<f32>, alpha: f32) -> vec4<f32> {
    let normalizedHue: f32 = 0.5 + 0.5 * atan2(velocity.y, velocity.x) / 3.14159;
    return colorFromHue(normalizedHue, alpha);
}
