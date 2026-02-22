// ─── App Entry Point ───
import './style.css';
import { registerScene, changeScene } from './sceneManager.js';
import * as titleScene from './scenes/titleScene.js';
import * as townScene from './scenes/townScene.js';
import * as dungeonScene from './scenes/dungeonScene.js';
import { initI18n } from './i18n.js';

import { initAdminButton } from './adminManager.js';
import { initAudio } from './soundEngine.js';

// Global Init
initI18n();
initAdminButton();

// Warm up Audio Context on first interaction to prevent lag
const warmUpAudio = () => {
    initAudio();
    ['click', 'touchstart', 'keydown'].forEach(evt => document.removeEventListener(evt, warmUpAudio));
};
['click', 'touchstart', 'keydown'].forEach(evt => document.addEventListener(evt, warmUpAudio, { once: true }));

// Register all scenes
registerScene('title', titleScene);
registerScene('town', townScene);
registerScene('dungeon', dungeonScene);

// Global UI
initAdminButton();

// Start with title scene
changeScene('title');
