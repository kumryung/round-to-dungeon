// ─── Scene Manager ───
// Each scene module must export { mount(container, params), unmount() }

let currentScene = null;
const scenes = {};

export function registerScene(name, sceneModule) {
  scenes[name] = sceneModule;
}

export function changeScene(name, params = {}) {
  const app = document.getElementById('app');
  if (currentScene && currentScene.unmount) {
    currentScene.unmount();
  }
  app.innerHTML = '';
  currentScene = scenes[name];
  if (!currentScene) {
    console.error(`Scene "${name}" not found`);
    return;
  }
  currentScene.mount(app, params);
}
