[[stage(vertex)]]
fn main_vertex([[location(0)]] inPosition: vec2<f32>) -> [[builtin(position)]] vec4<f32> {
    return vec4<f32>(inPosition.x, -inPosition.y, 0.0, 1.0);
}

[[block]] struct Uniforms {   //             align(4)  size(4)
    opacity: f32;             // offset(0)   align(4)  size(4)
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[stage(fragment)]]
fn main_fragment() -> [[location(0)]] vec4<f32> {
    return vec4<f32>(1.0, 1.0, 1.0, uniforms.opacity);
}
