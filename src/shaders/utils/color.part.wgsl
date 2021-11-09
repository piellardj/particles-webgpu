fn unpackColor(packed: u32, alpha: f32) -> vec4<f32> {
    return vec4<f32>(
        f32(packed & 255u) / 255.0,
        f32((packed >> 8u) & 255u) / 255.0,
        f32((packed >> 16u) & 255u) / 255.0,
        alpha
    );
}

fn packColor(color: vec3<f32>) -> u32 {
    let colorUint = vec3<u32>(
        u32(color.r * 255.0),
        u32(color.g * 255.0),
        u32(color.b * 255.0),
    );

    return colorUint.r |
        (colorUint.g << 8u) |
        (colorUint.b << 16u);
}
