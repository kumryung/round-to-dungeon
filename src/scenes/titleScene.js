// ─── Title Scene (시작씬) ───
import { changeScene } from '../sceneManager.js';

export function mount(container) {
  container.innerHTML = `
    <div class="title-scene">
      <div class="title-particles" id="titleParticles"></div>
      <div class="title-content">
        <div class="title-logo">
          <div class="title-icon">⚔️</div>
          <h1 class="title-name">Round to Dungeon</h1>
          <p class="title-subtitle">운명의 던전에 발을 들여라</p>
        </div>
        <button class="btn-start" id="btnStart">
          <span class="btn-start-text">게임 시작</span>
          <span class="btn-start-glow"></span>
        </button>
        <p class="title-hint">Press to begin your adventure</p>
      </div>
    </div>
  `;

  // Floating particles
  const particleContainer = document.getElementById('titleParticles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = 4 + Math.random() * 6 + 's';
    p.style.opacity = 0.2 + Math.random() * 0.5;
    p.style.width = p.style.height = 2 + Math.random() * 4 + 'px';
    particleContainer.appendChild(p);
  }

  document.getElementById('btnStart').addEventListener('click', () => {
    container.querySelector('.title-scene').classList.add('title-exit');
    setTimeout(() => changeScene('town'), 500);
  });
}

export function unmount() { }
