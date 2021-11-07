[[block]] struct Uniforms {   //             align(16)  size(24)
    color: vec4<f32>;         // offset(0)   align(16)  size(16)
    spriteSize: vec2<f32>;    // offset(16)   align(8)  size(8)
};

struct VSOut {
    [[builtin(position)]] position: vec4<f32>;
    [[location(0)]] localPosition: vec2<f32>; // in {-1, +1}^2
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[stage(vertex)]]
fn main_vertex([[location(0)]] inPosition: vec2<f32>, [[location(1)]] quadCorner: vec2<f32>) -> VSOut {
    var vsOut: VSOut;
    vsOut.position = vec4<f32>(inPosition + uniforms.spriteSize * quadCorner, 0.0, 1.0);
    vsOut.position.y = -vsOut.position.y;
    vsOut.localPosition = quadCorner;
    return vsOut;
}

[[stage(fragment)]]
fn main_fragment([[location(0)]] localPosition: vec2<f32>) -> [[location(0)]] vec4<f32> {
    let intensity = max(0.0, 1.0 - length(localPosition));
    return vec4<f32>(uniforms.color.rgb, uniforms.color.a * intensity);
}
