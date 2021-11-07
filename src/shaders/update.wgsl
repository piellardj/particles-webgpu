struct Particle {
    position: vec2<f32>;
};

[[block]] struct ParticlesBuffer {
    particles: array<Particle>;
};

[[group(0), binding(0)]] var<storage,read_write> particlesStorage: ParticlesBuffer;

[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index: u32 = GlobalInvocationID.x;

    var particle = particlesStorage.particles[index];
    particle.position = particle.position + vec2<f32>(0.0, 0.001);
    particlesStorage.particles[index] = particle;
}
