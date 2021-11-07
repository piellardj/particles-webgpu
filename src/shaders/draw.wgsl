[[stage(vertex)]]
fn main_vertex([[location(0)]] inPosition: vec2<f32>) -> [[builtin(position)]] vec4<f32> {
    return vec4<f32>(inPosition, 0.0, 1.0);
}

[[stage(fragment)]]
fn main_fragment() -> [[location(0)]] vec4<f32> {
    return vec4<f32>(1.0);
}
