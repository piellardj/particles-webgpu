struct Particle {
    position: vec2<f32>;
    velocity: vec2<f32>;
};

[[block]] struct ParticlesBuffer {
    particles: array<Particle>;
};

struct Attractor {                                 //             align(8)  size(16)
    position: vec2<f32>;                           // offset(0)   align(8)  size(8)
    force: f32;                                    // offset(8)   align(4)  size(4)
    // -- implicit padding --                      // offset(12)            size(4)
};

[[block]] struct Uniforms {                        //             align(8)  size(48)
    force: vec2<f32>;                              // offset(0)   align(8)  size(8)
    dt: f32;                                       // offset(8)   align(4)  size(4)
    bounce: u32;                                   // offset(12)  align(4)  size(4)

    attractorsCount: u32;                          // offset(16)  align(4)  size(4)
    // -- implicit padding --                      // offset(20)            size(12)
    [[align(16)]] attractors: array<Attractor, 1>; // offset(32)  align(16) size(16) stride(16)
};

[[group(0), binding(0)]] var<storage,read_write> particlesStorage: ParticlesBuffer;
[[group(0), binding(1)]] var<uniform> uniforms: Uniforms;

[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    let index: u32 = GlobalInvocationID.x;

    var particle = particlesStorage.particles[index];

    var force: vec2<f32> = uniforms.force;
    for (var i = 0u; i < uniforms.attractorsCount; i = i + 1u) {
        let toAttractor: vec2<f32> = uniforms.attractors[i].position - particle.position;
        let squaredDistance: f32 = dot(toAttractor, toAttractor);
        force = force + uniforms.attractors[i].force * toAttractor / (squaredDistance + 0.01);
    }

    particle.velocity = particle.velocity + uniforms.dt * force;
    particle.position = particle.position + uniforms.dt * particle.velocity;

    if (uniforms.bounce != 0u) {
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
    }

    particlesStorage.particles[index] = particle;
}
