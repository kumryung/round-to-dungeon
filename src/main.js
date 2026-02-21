// ─── App Entry Point ───
import './style.css';
import { registerScene, changeScene } from './sceneManager.js';
import * as titleScene from './scenes/titleScene.js';
import * as townScene from './scenes/townScene.js';
import * as dungeonScene from './scenes/dungeonScene.js';
import { initI18n } from './i18n.js';

import { initAdminButton } from './adminManager.js';

// Global Init
initI18n();
initAdminButton();

// Register all scenes
registerScene('title', titleScene);
registerScene('town', townScene);
registerScene('dungeon', dungeonScene);

// Global UI
initAdminButton();

// Start with title scene
changeScene('title');
