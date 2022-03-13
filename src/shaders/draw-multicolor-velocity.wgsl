struct VSOut {
    @builtin(position) position: vec4<f32>;
    @location(0) @interpolate(flat) color: vec4<f32>;
};

[[block]] struct Uniforms {   //             align(16)  size(16)
    color: vec4<f32>;         // offset(0)   align(16)  size(16)
};

[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

@stage(vertex)
fn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) inVelocity: vec2<f32>) -> VSOut {
    var output: VSOut;
    output.position = vec4<f32>(inPosition.x, -inPosition.y, 0.0, 1.0);
    output.color = colorFromVelocity(inVelocity, uniforms.color.a);
    return output;
}

@stage(fragment)
fn main_fragment(@location(0) @interpolate(flat) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
