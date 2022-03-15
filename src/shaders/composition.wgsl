struct Uniforms {             //             align(32)  size(20)
    color: vec4<f32>;         // offset(0)   align(16)  size(16)
    additiveBlending: u32;    // offset(16)  align(4)   size(4)
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var accumulationTexture: texture_2d<f32>;
@group(0) @binding(2) var accumulationTextureSampler: sampler;

struct VertexOut {
    @builtin(position) position: vec4<f32>;
    @location(0) uv: vec2<f32>;
}

@stage(vertex)
fn main_vertex(@builtin(vertex_index) inVertexIndex: u32) -> VertexOut {
    var out: VertexOut;
    if (inVertexIndex == 0u) {
        out.uv = vec2<f32>(0.0, 0.0);
    } else if (inVertexIndex == 1u) {
        out.uv = vec2<f32>(0.0, 1.0);
    } else if (inVertexIndex == 2u) {
        out.uv = vec2<f32>(1.0, 0.0);
    } else {
        out.uv = vec2<f32>(1.0, 1.0);
    }

    out.position = vec4<f32>(2.0 * out.uv.x - 1.0, 1.0 - 2.0 * out.uv.y, 0.0, 1.0);
    return out;
}

@stage(fragment)
fn main_fragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let cumulated = textureSample(accumulationTexture, accumulationTextureSampler, uv).r;

    if (uniforms.additiveBlending == 1u) {
        return vec4<f32>(255.0 * cumulated * uniforms.color.a * uniforms.color.rgb, 1.0);
    } else {
        return step(0.001, cumulated) * vec4<f32>(uniforms.color.rgb, 1.0);
    }
}
