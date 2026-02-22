// ─── VFX Engine (DOM & CSS based Visual Effects) ───

/**
 * Shake a specific element (defaults to the whole body)
 * @param {number} intensity - The shake intensity (1 to 10)
 * @param {number} durationMs - How long to shake in ms
 * @param {HTMLElement} element - Target element
 */
export function screenShake(intensity = 3, durationMs = 300, element = document.body) {
    if (!element) return;

    // Remove existing shake to restart
    element.classList.remove('vfx-shake-mild', 'vfx-shake-medium', 'vfx-shake-heavy');
    void element.offsetWidth; // Trigger reflow

    if (intensity <= 3) element.classList.add('vfx-shake-mild');
    else if (intensity <= 6) element.classList.add('vfx-shake-medium');
    else element.classList.add('vfx-shake-heavy');

    // Safety cleanup
    setTimeout(() => {
        element.classList.remove('vfx-shake-mild', 'vfx-shake-medium', 'vfx-shake-heavy');
    }, durationMs);
}

/**
 * Flash the screen a specific color
 * @param {string} color - CSS color (e.g., 'red', 'rgba(255, 215, 0, 0.3)')
 * @param {number} durationMs - How long the flash lasts
 */
export function screenFlash(color = 'rgba(255,0,0,0.3)', durationMs = 300) {
    const flash = document.createElement('div');
    flash.className = 'vfx-flash';
    flash.style.backgroundColor = color;
    flash.style.animationDuration = `${durationMs}ms`;

    document.body.appendChild(flash);

    setTimeout(() => {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, durationMs);
}

/**
 * Spawn temporary particles at a specific viewport coordinate
 * @param {number} clientX - Screen X 
 * @param {number} clientY - Screen Y
 * @param {object} options - Configuration for particles
 */
export function spawnParticles(clientX, clientY, options = {}) {
    const count = options.count || 5;
    const emoji = options.emoji || '✨';
    const color = options.color || null; // Optional text color if using characters instead of emoji
    const spread = options.spread || 40; // Pixels

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${clientX}px`;
    container.style.top = `${clientY}px`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'vfx-particle';
        p.textContent = emoji;
        if (color) p.style.color = color;

        // Random trajectory
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - (spread * 0.5); // Bias upwards

        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);

        // Slight random delay and duration
        const duration = 0.4 + Math.random() * 0.3;
        p.style.animation = `particleBurst ${duration}s ease-out forwards`;

        container.appendChild(p);
    }

    setTimeout(() => {
        if (container.parentNode) container.parentNode.removeChild(container);
    }, 1000);
}

/**
 * Spawn particles relative to a specific DOM element's center
 */
export function spawnParticlesAtElement(element, options = {}) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnParticles(cx, cy, options);
}
