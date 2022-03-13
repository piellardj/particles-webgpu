[[block]] struct Uniforms {   //             align(16)  size(24)
    color: vec4<f32>;         // offset(0)   align(16)  size(16)
    spriteSize: vec2<f32>;    // offset(16)   align(8)  size(8)
};

struct VertexOutput {
    [[builtin(position)]] position: vec4<f32>;
    @location(0) localPosition: vec2<f32>; // in {-1, +1}^2
    @location(1) @interpolate(flat) color: vec4<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[stage(vertex)]]
fn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) inVelocity: vec2<f32>, @location(2) quadCorner: vec2<f32>) -> VertexOutput {
    var vsOut: VertexOutput;
    vsOut.position = vec4<f32>(inPosition + uniforms.spriteSize * quadCorner, 0.0, 1.0);
    vsOut.position.y = -vsOut.position.y;
    vsOut.localPosition = quadCorner;
    vsOut.color = colorFromVelocity(inVelocity, uniforms.color.a);
    return vsOut;
}

[[stage(fragment)]]
fn main_fragment(@location(0) localPosition: vec2<f32>, @location(1) @interpolate(flat) color: vec4<f32>) -> @location(0) vec4<f32> {
    let distanceFromCenter: f32 = length(localPosition);
    if (distanceFromCenter > 1.0) {
        discard;
    }

    return color;
}
