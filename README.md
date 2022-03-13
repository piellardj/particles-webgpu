# particles-webgpu

This project a basic particles simulation running fully on GPU, using the new WebGPU API. Particles evolve independently, following simple gravitational rules. There can be several attraction points at once. You can control one with your mouse by pressing the left mouse button.


Chrome 94 brings experimental support for the new WebGPU API. To enable it, a flag is available in `chrome://flags/#enable-unsafe-webgpu`. If you can't find this flag, try using Chrome Canary instead.

This is actually a WebGPU port of my old [particles-gpu](https://github.com/piellardj/particles-gpu) project. The main differences are that this one uses compute shaders, and stores the particles in a GPUBuffer instead of a texture.

See it live [here](https://piellardj.github.io/particles-webgpu/?page%3Acanvas%3Afullscreen=true&page%3Acanvas%3Asidepane=true&page%3Arange%3Aparticles-count-range-id=3).

## Preview
![Illustration 1](src/readme/01.png)

![Illustration 2](src/readme/02.png)

## Notes
This is my first WebGPU project, so I probably made a few mistakes. Also, I am discovering behaviours that surprise me. Here is a documentation of most of them. I guess what follows is obvious to someone familiar modern APIs such as Vulkan (or even late OpenGL).

### Explicit errors
The first thing I noted is that the browser seems to perform tons of validity checks for each instruction, which makes debugging way easier than WebGL. Moreover, the messages clearly specify which validity check failed, why these checks were performed, etc.

### `var` and `let`
Keywords `var` and `let` don't mean the same thing than in Javascript. In WGSL, `var` declares an object that can vary, while `let` declares an immutable object
[Specification here](https://www.w3.org/TR/WGSL/#var-and-let).

### Alignment of `struct`
I encountered a unexpected behaviour in a shader with a `struct` I used to describe a uniform buffer.

#### Issue
Here is how I described it in the shader (wgsl):
```glsl
struct Uniforms {
    singleFloat: f32;
    vecFloat: vec2<f32>;
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
```
and here is how I first created it and included it (javascript):
```javascript
const gpuBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT * (1 + 2), // one f32 and one vec2<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
});
device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
        binding: 0,
        resource: { buffer: gpuBuffer }
    }]
});
```
To my surprise, Chrome outputed the following error:
```
Binding size (12) is smaller than the minimum binding size (16).
 - While validating entries[0] as a Buffer
 - While validating [BindGroupDescriptor] against [BindGroupLayout]
 - While calling [Device].CreateBindGroup([BindGroupDescriptor]).
```

In an attempt of fixing it, I naively complied and padding the buffer to make its size 16 bytes. It "fixed" this specific issue but things still didn't behave as I expected.
```javascript
// creation
const gpuBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT * (1 + 2 + 1), // one f32 and one vec2<f32> and one padding float
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
});
// ... add it to a bindgroup ;.. //

// writing
const a = ..., b = ..., c = ...;
const floatBuffer = new Float32Array([a, b, c]);
const buffer = floatBuffer.buffer;
device.queue.writeBuffer(this.renderpassUniformsBuffer, 0, buffer);

// ... bind the bindgroup to a renderpass ... //
```
During the shader execution, I expected to have:
```glsl
(uniforms.singleFloat == a) && (uniforms.vecFloat == vec2<f32>(b, c))
```
but instead got:
```glsl
(uniforms.singleFloat == a) && (uniforms.vecFloat == vec2<f32>(c, 0.0))
```

#### Cause and fix
This issue came from alignment of types in WGSL. This behaviour is described in the [Structure Layout Rules](https://www.w3.org/TR/WGSL/#structure-layout-rules) and [Alignment and Size](https://www.w3.org/TR/WGSL/#alignof) sections of the WGSL spec.

Each type has their own alignment requirements. In this case, the relevant info is: `AlignOf(f32) == 4` and `AlignOf(vec2<f32>) == 8`. This means that when I write:
```glsl
struct Uniforms {
    singleFloat: f32;
    vecFloat: vec2<f32>;
};
```
because of the 8-bytes alignment of `vec2<f32>`, it is actually translated as:
```glsl
struct Uniforms {
    singleFloat: f32;
    unusablePaddingFloat: f32;
    vecFloat: vec2<f32>;
};
```
This explains why
- Chrome was requesting a minimum binding size of 16
- and when using the buffer `[a, b, c, 0]` as my uniform buffer, `uniforms.vecFloat` was filled with `(c,0)` instead of `(b,c)`.

Since `f32` are 4-bytes aligned and I don't care about the alignment/stride of the `struct` itself, the fix I used is surprisingly simple: switch my two properties:
```glsl
struct Uniforms {
    vecFloat: vec2<f32>;
    singleFloat: f32;
};
```
It is worth noting that one can explicit alignment and stride of each property with by decorating them with the WGSL attributes `[[align(X)]]` and `[[stride(Y)]]`.

### Usage of Float16
#### Float16 in WGSL
I was surprised to see that according to the [Floating Point Evaluation](https://www.w3.org/TR/WGSL/#floating-point-evaluation) section of the spec, WebGPU uses Float32 precision for shader computations (and 32-bits types in general). What a difference with WebGL where some devices only supported `lowp` !

According to the [Plain types](https://www.w3.org/TR/WGSL/#plain-types-section) section of the WGSL spec, the base types are `bool`, `u32`, `i32`, `f32` but there is no `f16`.

For my computations, storing the positions and velocities as Float16 would be enough. However since I store them in buffers, I have to use Float32, so each particle takes 16 bytes (one `vec2<f32>` for position, one `vec2<f32>` for velocity), which is a lot.
One way to use Float16 for storage would be to use a [`rgba16float`](https://www.w3.org/TR/webgpu/#plain-color-formats) texture and manipulating it texel by texel with [`textureLoad`](https://www.w3.org/TR/WGSL/#textureload) and [`textureStore`](https://www.w3.org/TR/WGSL/#texturestore).

#### Float16 in Javascript
One issue I would have if I used a `rgba16float` texture for storing the position/velocity in a texel would be to initialize this texture. One way to fill a texture is to use the `GPUDevice.GPUQueue.writeTexture` method, by passing it an `ArrayBuffer`. However, sadly in Javascript there is no TypedArray for Float16: there are amongst others `Uint8Array`, `Uint16Array`, `Uint32Array`, `BigUint64Array`, `Float32Array` and `Float64Array` however there is no `Float16Array`. I don't know why this type is lacking but I feel like it would be useful. To avoid this issue, I would have either
- to craft on CPU-side Float16 with bit manipulations
- or to initialize the texture on the GPU. Initial positions are random and having nice random in shaders is a bit tricky. WGSL support bit operations on ui32, so I suppose a simple PCG random number generator could be implemented in a compute shader (maybe by using built-ins such as `GlobalInvocationId` as part of the seed ?).

### Data packing
WebGPU offers nice data packing builtin functions ([see spec here](https://www.w3.org/TR/WGSL/#pack-builtin-functions)) such as `pack4x8unorm` and `unpack4x8unorm`, which allow compact packing of `vec4<f32>` into `u32` (useful for storing colors for instance).
