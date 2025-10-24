var c, gl;
var v_shader, f_shader, shaderprogram;
var vertices, indices, v_buffer, i_buffer;

// webcam as background image --> chatGPT
async function startWebcamBackground() {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          const video = document.getElementById("video-bg");
          video.srcObject = stream;
          document.getElementsByTagName('html')[0].style.backgroundImage = 'none'
          document.getElementsByTagName('html')[0].style.backgroundSize = 'none'
      } catch (err) {
          console.error('Error accessing webcam:', err);
      }
    };

startWebcamBackground();

window.onload = function() {
    //************************************************************//
    //
    // INITIALIZE WEBGL
    //
    c = document.getElementById( 'c' ); // setup canvas
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    gl = c.getContext( 'webgl' ); // setup GL context
    gl.viewport(0, 0, c.width, c.height );


    //************************************************************//
    //
    // SHADERS
    //
    v_shader = gl.createShader( gl.VERTEX_SHADER );
    f_shader = gl.createShader( gl.FRAGMENT_SHADER );

    // compile vertex shader
    gl.shaderSource( v_shader, document.getElementById( 'vertexshader' ).innerText );
    gl.compileShader( v_shader );

    if (!gl.getShaderParameter( v_shader, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderInfoLog( v_shader ));
    }

    // compile fragment shader
    gl.shaderSource( f_shader, document.getElementById( 'fragmentshader' ).innerText );
    gl.compileShader( f_shader );

    if (!gl.getShaderParameter( f_shader, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderInfoLog( f_shader ));
    }

    // attach and link the shaders
    shaderprogram = gl.createProgram();
    gl.attachShader( shaderprogram, v_shader );
    gl.attachShader( shaderprogram, f_shader );

    gl.linkProgram( shaderprogram );

    gl.useProgram( shaderprogram );


    // create first BIG fish
    all_fish = [];
    all_fish.push(createFish([1, 0, 0, 1], [0, 0, 0], 1, -1));

    // create random fishies
    for (let i = 0; i < 100; i++) {
        random_color = [Math.random(), Math.random(), Math.random(), Math.random()];
        random_offset = [Math.random() - Math.random(), Math.random() - Math.random(), 0];
        random_scale = Math.random() * 0.3;

        all_fish.push(createFish(random_color, random_offset, random_scale, 1));
    }



    animate();

};


function createFish(color, offset, scale, direction) {

    //************************************************************//
    //
    // CREATE GEOMETRY
    //
    var vertices = new Float32Array([
         0.5,  0.0, 0.0, // 0: nose
         0.2,  0.25, 0.0, // 1: upper body
        -0.2,  0.15, 0.0, // 2: upper tail base
        -0.4,  0.3, 0.0, // 3: upper tail tip
        -0.4, -0.3, 0.0, // 4: lower tail tip
        -0.2, -0.15, 0.0, // 5: lower tail base
         0.2, -0.25, 0.0, // 6: lower body
    ]);

    // now use indices
    var indices = new Uint8Array([
        0, 1, 6,
        1, 2, 6,
        2, 5, 6,
        2, 3, 5,
        3, 4, 5,
    ]); // 6 bytes

    // fish body vertices
    var v_buffer = gl.createBuffer(); // create
    gl.bindBuffer( gl.ARRAY_BUFFER, v_buffer ); // bind
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW ); // put data in
    gl.bindBuffer( gl.ARRAY_BUFFER, null ); // unbind

    // fish body indices
    var i_buffer = gl.createBuffer(); // create
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, i_buffer ); // bind
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW ); // put data in
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null ); // unbind

    var eye_vertex = new Float32Array([0.2, 0.2, 0.0]);

    // flip eye if direction inverted
    if (direction == -1) {
        eye_vertex[1] = eye_vertex[1] * -1;
    }

    var eye_v_buffer = gl.createBuffer(); // create
    gl.bindBuffer(gl.ARRAY_BUFFER, eye_v_buffer); // bind
    gl.bufferData(gl.ARRAY_BUFFER, eye_vertex, gl.STATIC_DRAW); // put data in
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // unbind


    return [v_buffer, i_buffer, eye_v_buffer, color, offset, scale, direction];

};

var step_x = .01;
var step_y = .01;
var direction = -1;

function animate() {

    requestAnimationFrame(animate);

    gl.clearColor( 0., 0., 0., 0.)
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.disable(gl.DEPTH_TEST);



    for( var r = 0; r < all_fish.length; r++ ) {

        // current_buffers is a list of [v_buffer, i_buffer]-pairs
        var current_buffers = all_fish[r];
        var current_v_buffer = current_buffers[0];
        var current_i_buffer = current_buffers[1];
        var current_eye_v_buffer = current_buffers[2];
        var current_color = current_buffers[3];
        var current_offset = current_buffers[4];
        var current_scale = current_buffers[5];
        var current_direction = current_buffers[6];

        // update offsets
        current_offset[0] += 0.01;
        current_offset[1] += 0.1 * Math.random();
        current_offset[1] -= 0.1 * Math.random();

        if (current_offset[0] >= 1) {
            current_direction = -1;
        }

        current_offset[0] *= current_direction;



        //************************************************************//
        //
        // CONNECT SHADER WITH GEOMETRY
        //

        gl.bindBuffer( gl.ARRAY_BUFFER, current_v_buffer );

        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, current_i_buffer );

        // find the attribute in the shader source
        var a_position = gl.getAttribLocation( shaderprogram, 'a_position' );

        gl.vertexAttribPointer( a_position, 3, gl.FLOAT, false, 0, 0 );

        gl.enableVertexAttribArray ( a_position );


        var theta = (Math.random()*10) * Math.PI/180; // degrees to radians

        // the scalar to multiply across the diagonal
        const scalar = current_direction * current_scale;

        // transformation matrix
        var transform = new Float32Array([
            scalar * Math.cos(theta), Math.sin(theta), 0, 0,
            -Math.sin(theta), scalar * Math.cos(theta), 0, 0,
            0, 0, scalar * 1, 0,
            current_offset[0], current_offset[1], current_offset[2], 1
        ]);

        var u_transform = gl.getUniformLocation(shaderprogram, 'u_transform');
        gl.uniformMatrix4fv(u_transform, false, transform);


        // Set blue hue and transparency to smaller fish
        var t = performance.now() * 0.001;
        var a = 0.6 + 0.4 * Math.sin(t * 2.0); // from 0.2 to 1.0
        current_color = new Float32Array([
            0.3 + 0.2 * Math.sin(t + 0.0),
            0.6 + 0.2 * Math.sin(t + 2.0),
            0.9 + 0.1 * Math.sin(t + 4.0),
            a
        ]);

        // make the large fish red
        if (r == 0) {
            current_color = [1, 0, 0, 0.9];
        }

        // Pass colors to shaders
        var u_color = gl.getUniformLocation( shaderprogram, 'u_color' );
        gl.uniform4fv( u_color, current_color );

        // Draw
        gl.drawElements( gl.TRIANGLES, 15, gl.UNSIGNED_BYTE, 0);

        //******* EYE ********
        gl.uniform4fv(u_color, new Float32Array([0, 0, 0, 0.5]));

        var u_pointsize = gl.getUniformLocation(shaderprogram, 'u_pointsize');
        gl.uniform1fv(u_pointsize, new Float32Array([current_scale*20.]));

        gl.enableVertexAttribArray(a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, current_eye_v_buffer);
        gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_position);
        gl.drawArrays(gl.POINTS, 0, 1);
    };
};

