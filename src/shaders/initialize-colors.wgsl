struct Particle {
    position: vec2<f32>;
    velocity: vec2<f32>;
};

struct ParticlesBuffer {
    particles: array<Particle>;
};

struct ColorsBuffer {
    color: array<u32>;
};

[[group(0), binding(0)]] var<storage,read> particlesStorage: ParticlesBuffer;
[[group(0), binding(1)]] var<storage,write> colorsStorage: ColorsBuffer;
[[group(1), binding(0)]] var inputSampler : sampler;
[[group(1), binding(1)]] var inputTexture: texture_2d<f32>;

@stage(compute) @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let index: u32 = GlobalInvocationID.x;
    let inputTextureDimensions : vec2<i32> = textureDimensions(inputTexture, 0);

    let uv = 0.5 + 0.5 * particlesStorage.particles[index].position;
    let color = textureSampleLevel(inputTexture, inputSampler, uv, 0.0).rgb;
    colorsStorage.color[index] = packColor(color);
}
