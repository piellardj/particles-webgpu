struct Particle {
    position: vec2<f32>;
    velocity: vec2<f32>;
};

[[block]] struct ParticlesBuffer {
    particles: array<Particle>;
};

[[block]] struct Uniforms {
    force: vec2<f32>;
    dt: f32;
};

[[group(0), binding(0)]] var<storage,read_write> particlesStorage: ParticlesBuffer;
[[group(0), binding(1)]] var<uniform> uniforms: Uniforms;

[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index: u32 = GlobalInvocationID.x;

    var particle = particlesStorage.particles[index];
    particle.velocity = particle.velocity + uniforms.dt * uniforms.force;
    particle.position = particle.position + uniforms.dt * particle.velocity;

    if (particle.position.x < -1.0) {
        particle.position.x = -2.0 - particle.position.x;
        particle.velocity.x = -particle.velocity.x;
    }
    if (particle.position.y < -1.0) {
        particle.position.y = -2.0 - particle.position.y;
        particle.velocity.y = -particle.velocity.y;
    }

    if (particle.position.x > 1.0) {
        particle.position.x = 2.0 - particle.position.x;
        particle.velocity.x = -particle.velocity.x;
    }
    if (particle.position.y > 1.0) {
        particle.position.y = 2.0 - particle.position.y;
        particle.velocity.y = -particle.velocity.y;
    }
    
    particlesStorage.particles[index] = particle;
}
