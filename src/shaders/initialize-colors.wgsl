struct Particle {
    position: vec2<f32>;
    velocity: vec2<f32>;
};

[[block]] struct ParticlesBuffer {
    particles: array<Particle>;
};

[[block]] struct ColorsBuffer {
    color: array<u32>;
};

[[group(0), binding(0)]] var<storage,read> particlesStorage: ParticlesBuffer;
[[group(0), binding(1)]] var<storage,write> colorsStorage: ColorsBuffer;
[[group(1), binding(0)]] var inputSampler : sampler;
[[group(1), binding(1)]] var inputTexture: texture_2d<f32>;

[[stage(compute), workgroup_size(256)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index: u32 = GlobalInvocationID.x;
    let inputTextureDimensions : vec2<i32> = textureDimensions(inputTexture, 0);

    let uv = 0.5 + 0.5 * particlesStorage.particles[index].position;
    let color = textureSampleLevel(inputTexture, inputSampler, uv, 0.0).rgb;
    let colorUint = vec3<u32>(
        u32(color.r * 255.0),
        u32(color.g * 255.0),
        u32(color.b * 255.0),
    );

    colorsStorage.color[index] = 
        colorUint.r |
        (colorUint.g << 8u) |
        (colorUint.b << 16u);
}
