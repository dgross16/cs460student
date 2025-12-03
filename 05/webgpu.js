window.onload = async () => {
  let canvas = document.getElementById('scene');
  let engine = new BABYLON.WebGPUEngine(canvas, {antialiasing: true});
  await engine.initAsync();
  const scene = new BABYLON.Scene(engine);

  await BABYLON.SceneLoader.AppendAsync('', 'adidas_samba.glb', scene);

  scene.createDefaultCameraOrLight(true, true, true);
  scene.activeCamera.attachControl(canvas, true);

  engine.runRenderLoop(() => scene.render());
  addEventListener('resize', () => engine.resize())
}
