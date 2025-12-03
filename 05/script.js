import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Pane } from 'tweakpane';
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js'

var renderer, controls, scene, camera, effect, stats;

var pane = new Pane();
var sceneui = pane.addFolder({title: 'Scene'});
var polyui = pane.addFolder({title: 'PolyCam Mesh'});
var blenderui = pane.addFolder({title: 'Blender Mesh'});


window.onload = function() {
  window.SCENE = {
    'anaglyph': false,
    // polycam mesh
    'poly': null,
    'rotate_poly': false,
    'do_rotate_poly': function () {
        window.SCENE.rotate_poly = !window.SCENE.rotate_poly;
    },
    // blender mesh
    'blender': null,
    'blender_helper': null,
    'rotate_blender': false,
    'do_rotate_blender': function () {
        window.SCENE.rotate_blender = !window.SCENE.rotate_blender;
    },

    'blender_old_material': null,
    'change_material': function () {
      if (!window.SCENE.blender_old_material) {
        window.SCENE.blender_old_material = window.SCENE.blender.material.clone();
        window.SCENE.blender.material = new THREE.MeshNormalMaterial();
      } else {
        window.SCENE.blender.material = window.SCENE.blender_old_material.clone();
        window.SCENE.blender_old_material = null;
      }
    }
  };

  scene = new THREE.Scene();

  // setup the camera
  var fov = 100;
  var ratio = window.innerWidth / window.innerHeight;
  var zNear = .1;
  var zFar = 10000;
  camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
  camera.position.set(-8, 5, 0);

  // create renderer and setup the canvas
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // stats.js widget
  stats = new Stats();
  document.body.appendChild(stats.domElement);

  // 3D Anaglyph effect
  effect = new AnaglyphEffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );

  // setup lights
  var ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  var light = new THREE.DirectionalLight(0xffffff, 5.0);
  light.position.set(10, 100, 10);
  scene.add(light);

  // scene tweakpane
  sceneui.addBinding(window.SCENE, 'anaglyph', {label: '3D!'});
  sceneui.addBinding(light.position, 'x', {min:-100, max:100, label:'Light X'});
  sceneui.addBinding(light.position, 'y', {min:-100, max:100, label:'Light Y'});
  sceneui.addBinding(light.position, 'z', {min:-100, max:100, label:'Light Z'});
  sceneui.addBinding(light, 'intensity', {min: 0, max:10, label:'Intensity'});
  sceneui.addBinding(ambientLight, 'color', {label:'AmbientLightColor'});


  // load rendered scan
  const loader = new GLTFLoader();
  loader.load('adidas_samba.glb', (gltf) => {
    const samba = gltf.scenes[0].children[0]

    window.SCENE.poly = samba;

    polyui.addBinding(window.SCENE.poly.material, 'wireframe');
    polyui.addButton({title:'rotate!'}).on('click', () => {
        window.SCENE.do_rotate_poly();
    });

    samba.scale.x = 10;
    samba.scale.y = 10;
    samba.scale.z = 10;

    samba.quaternion.w = 1;
    samba.quaternion.x = 0;
    samba.quaternion.y = 0;
    samba.quaternion.z = 0;

    samba.translateY(-5);
    samba.translateX(1);
    samba.translateZ(-3);

    scene.add(gltf.scene);

  });

  loader.load('adidas_samba_edited.glb', (gltf) => {
    const samba = gltf.scenes[0].children[0]

    window.SCENE.blender = samba;

    // helper for the Normals
    const helper = new VertexNormalsHelper(samba, 0.1, 'blue');
    helper.visible = false;
    window.SCENE.blender_helper = helper;
    scene.add(helper);


    blenderui.addBinding(window.SCENE.blender.material, 'wireframe');
    blenderui.addBinding(window.SCENE.blender_helper, 'visible', {label: 'Show normals!'})
    blenderui.addButton({title:'rotate!'}).on('click', () => {
        window.SCENE.do_rotate_blender();
    });
    blenderui.addButton({title:'Change Material'}).on('click', () => {
        window.SCENE.change_material();
    });

    samba.scale.x = 10;
    samba.scale.y = 10;
    samba.scale.z = 10;

    samba.quaternion.w = 1;
    samba.quaternion.x = 0;
    samba.quaternion.y = 0;
    samba.quaternion.z = 0;

    samba.translateX(-1);
    samba.translateZ(3);

    scene.add(gltf.scene);
  });




  // interaction
  controls = new OrbitControls(camera, renderer.domElement);

  // call animation/rendering loop
  animate();

};

function animate() {

  requestAnimationFrame(animate);

  if (window.SCENE.poly) {
    if (window.SCENE.rotate_poly) {
      // TODO setup 180 degree quaternion
      const q = rotationQuaternion(180, [0, 1, 0]);
      window.SCENE.poly.quaternion.slerp(q, 0.01);
    } else {
      // TODO reset quaternion to identity!
      const q = new THREE.Quaternion(0, 0, 0, 1);
      window.SCENE.poly.quaternion.slerp(q, 0.01);
    }
  }
  if (window.SCENE.blender) {
    if (window.SCENE.rotate_blender) {
      // TODO setup 180 degree quaternion
      const q = rotationQuaternion(180, [0, 1, 0]);
      window.SCENE.blender.quaternion.slerp(q, 0.01);
    } else {
      // TODO reset quaternion to identity!
      const q = new THREE.Quaternion(0, 0, 0, 1);
      window.SCENE.blender.quaternion.slerp(q, 0.01);
    }
    window.SCENE.blender_helper.update();
  }

  controls.update();

  renderer.render(scene, camera);
  if (window.SCENE.anaglyph) {
    effect.render(scene, camera);
  }
  stats.update();

};

// returns a rotation quaternion
function rotationQuaternion (angle, axis) {
    const t = (angle * Math.PI) / 180

    const x = Math.sin(t / 2) * axis[0];
    const y = Math.sin(t / 2) * axis[1];
    const z = Math.sin(t / 2) * axis[2];
    const w = Math.cos(t / 2);

    return new THREE.Quaternion(x, y, z, w);
}
