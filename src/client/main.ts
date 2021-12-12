import { mat4, vec3 } from "gl-matrix";

function main()
{
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");

    const vertShaderSrc =
        `#version 300 es
        in vec2 aPosition;
        in vec2 aTexCoord;
        uniform mat4 uMvpMatrix;
        out vec2 vTexCoord;
        void main()
        {
            gl_Position = uMvpMatrix * vec4(aPosition, 0.0, 1.0);
            vTexCoord = aTexCoord;
        }`;

    const fragShaderSrc =
        `#version 300 es
        precision mediump float;
        uniform sampler2D uSampler;
        in vec2 vTexCoord;
        out vec4 fragColor;
        void main()
        {
            fragColor = texture(uSampler, vTexCoord);
        }`;

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vertShaderSrc);
    gl.compileShader(vShader);
    let ok = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
    if (!ok) { console.log(gl.getShaderInfoLog(vShader));; }

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fragShaderSrc);
    gl.compileShader(fShader);
    ok = gl.getShaderParameter(fShader, gl.COMPILE_STATUS);
    if (!ok) { console.log(gl.getShaderInfoLog(fShader));; }

    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!ok) { console.log(gl.getProgramInfoLog(program)); }
    gl.useProgram(program);

    const aPositionLocation = gl.getAttribLocation(program, "aPosition");
    const aTexCoordLocation = gl.getAttribLocation(program, "aTexCoord");

    const vertPositions = [
        -0.5, -0.5, // frame 00
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5,
        -0.5, -0.5, // frame 01
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5,
        -0.5, -0.5, // frame 02
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5,
        -0.5, -0.5, // frame 03
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5
    ];
    const vertPosVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertPosVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPositions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPositionLocation);

    const texCoords = [
        0, 1, // frame 00
        1 / 4, 1,
        0, 0,
        1 / 4, 0,
        1 / 4, 1, // frame 01
        2 / 4, 1,
        1 / 4, 0,
        2 / 4, 0,
        2 / 4, 1, // frame 02
        3 / 4, 1,
        2 / 4, 0,
        3 / 4, 0,
        3 / 4, 1, // frame 03
        1, 1,
        3 / 4, 0,
        1, 0
    ];
    const texCoordVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoordLocation);

    const projMatrix = mat4.create();
    mat4.ortho(projMatrix, 0, 100, 0, 100, 100, -100);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 0, 90], [0, 0, 0], [0, 1, 0]);

    const projViewMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    const modelMatrix = mat4.create();

    mat4.mul(projViewMatrix, projMatrix, viewMatrix);

    const uMvpMatrixLocation = gl.getUniformLocation(program, "uMvpMatrix");
    const uSamplerLocation = gl.getUniformLocation(program, "uSampler");
    gl.uniform1i(uSamplerLocation, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.93, 0.95, 0.98, 1);

    let currentTime: number;
    let lastTime: number;
    let deltaTime: number;
    let animationTime = 0;
    const timePeriod = 250;
    let drawingIndex = 0;

    const image = new Image();
    image.onload =
        () =>
        {
            gl.activeTexture(gl.TEXTURE0);

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            mat4.identity(modelMatrix);
            mat4.translate(modelMatrix, modelMatrix, [50, 50, 0]);
            // mat4.rotateZ(modelMatrix, modelMatrix, 30 * Math. PI / 180);
            mat4.scale(modelMatrix, modelMatrix, [40, 50, 1]);
            mat4.mul(mvpMatrix, projViewMatrix, modelMatrix);
            gl.uniformMatrix4fv(uMvpMatrixLocation, false, mvpMatrix);

            lastTime = Date.now();
            animationLoop();
        };
    image.src = "assets/fang-idle.png";

    function animationLoop(): void
    {
        requestAnimationFrame(() => animationLoop());

        currentTime = Date.now();
        deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        animationTime += deltaTime;
        if (animationTime >= timePeriod)
        {
            animationTime = 0;

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, drawingIndex, 4);

            drawingIndex += 4;
            if (drawingIndex >= 16) { drawingIndex = 0; }
        }
    }
}

// Debug
main();

// Release
// window.onload = () => main();
