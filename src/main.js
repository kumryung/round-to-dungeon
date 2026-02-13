// ─── App Entry Point ───
import './style.css';
import { registerScene, changeScene } from './sceneManager.js';
import * as titleScene from './scenes/titleScene.js';
import * as townScene from './scenes/townScene.js';
import * as dungeonScene from './scenes/dungeonScene.js';

// Register all scenes
registerScene('title', titleScene);
registerScene('town', townScene);
registerScene('dungeon', dungeonScene);

// Start with title scene
changeScene('title');
