struct VSOut {
    [[builtin(position)]] position: vec4<f32>;
    [[location(0)]] color: vec3<f32>;
};

[[stage(vertex)]]
fn main_vertex([[location(0)]] inPosition: vec2<f32>, [[location(1)]] inColor: vec3<f32>) -> VSOut {
    var output: VSOut;
    output.position = vec4<f32>(inPosition.x, -inPosition.y, 0.0, 1.0);
    output.color = inColor;
    return output;
}

[[block]] struct Uniforms {   //             align(16)  size(16)
    color: vec4<f32>;         // offset(0)   align(16)  size(16)
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[stage(fragment)]]
fn main_fragment([[location(0)]] color: vec3<f32>) -> [[location(0)]] vec4<f32> {
    return vec4<f32>(color, uniforms.color.a);
}
