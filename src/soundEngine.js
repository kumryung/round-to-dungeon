// ─── Sound Engine (Web Audio API Synthesizer) ───
// No external files used. All sounds are procedurally generated oscillators.

import { getState, saveState } from './gameState.js';

let audioCtx = null;
let masterGain = null;

/**
 * Initialize the Audio Context (must be called after a user interaction to work in most browsers)
 */
export function initAudio() {
    if (audioCtx) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();

        const state = getState();
        const vol = state.globalVolume !== undefined ? state.globalVolume : 0.5;
        const muted = state.isMuted !== undefined ? state.isMuted : false;

        masterGain = audioCtx.createGain();
        masterGain.gain.value = muted ? 0 : vol;
        masterGain.connect(audioCtx.destination);
    } catch (e) {
        console.warn("Web Audio API not supported", e);
    }
}

export function setVolume(v) {
    const state = getState();
    const vol = Math.max(0, Math.min(1, v));
    state.globalVolume = vol;
    saveState();

    if (masterGain && !state.isMuted) {
        masterGain.gain.value = vol;
    }
}

export function toggleMute() {
    const state = getState();
    state.isMuted = !state.isMuted;
    saveState();

    if (masterGain) {
        masterGain.gain.value = state.isMuted ? 0 : state.globalVolume;
    }
    return state.isMuted;
}

export function getIsMuted() {
    return getState().isMuted || false;
}

export function getGlobalVolume() {
    return getState().globalVolume !== undefined ? getState().globalVolume : 0.5;
}

/**
 * Helper to play a tone with envelope control
 */
function playTone(freq, type, duration, volStart = 1, volEnd = 0, pitchSlide = 0) {
    if (!audioCtx || getIsMuted()) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    osc.frequency.setValueAtTime(freq, t);

    if (pitchSlide !== 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * pitchSlide, t + duration);
    }

    gain.gain.setValueAtTime(volStart, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volEnd), t + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + duration);
}

/**
 * Helper to play noise (for hits, explosions)
 */
function playNoise(duration, volStart = 1, volEnd = 0.01) {
    if (!audioCtx || getIsMuted()) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    // Lowpass filter for punchier impact
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volStart, t);
    gain.gain.exponentialRampToValueAtTime(volEnd, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(t);
}

/**
 * Main switchboard for all sound effects
 * @param {string} sfxName 
 */
export function playSFX(sfxName) {
    if (!audioCtx) initAudio();
    if (!audioCtx || getIsMuted()) return;

    switch (sfxName) {
        // ─── COMBAT ───
        case 'hit':
            playNoise(0.15, 0.8, 0.01);
            playTone(150, 'square', 0.1, 0.4, 0.01, 0.5);
            break;

        case 'crit':
            playNoise(0.2, 1.0, 0.01);
            playTone(800, 'sawtooth', 0.2, 0.7, 0.01, 0.2); // sharp drop
            playTone(1200, 'square', 0.1, 0.5, 0.01, 2.0); // sharp rise
            break;

        case 'miss':
            playTone(200, 'sine', 0.2, 0.3, 0.01, 0.5); // "whiff" drop
            break;

        case 'playerHit':
            playNoise(0.3, 1.0, 0.01);
            playTone(100, 'sawtooth', 0.3, 0.8, 0.01, 0.5); // heavy low thud
            break;

        case 'victory':
            // Arpeggio up
            playTone(440, 'square', 0.3, 0.3, 0.01); // A
            setTimeout(() => playTone(554, 'square', 0.3, 0.3, 0.01), 100); // C#
            setTimeout(() => playTone(659, 'square', 0.4, 0.4, 0.01), 200); // E
            setTimeout(() => playTone(880, 'square', 0.6, 0.5, 0.01), 300); // A (high)
            break;

        case 'defeat':
            playTone(200, 'sawtooth', 1.0, 0.5, 0.01, 0.2); // long descending wail
            break;

        // ─── DUNGEON / UI ───
        case 'dice':
            // Rapid sequence of 3-4 random ticks
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    playTone(600 + Math.random() * 400, 'square', 0.05, 0.2, 0.01);
                }, i * 60 + Math.random() * 20);
            }
            break;

        case 'itemPickup':
            playTone(880, 'sine', 0.1, 0.3, 0.01);
            setTimeout(() => playTone(1760, 'sine', 0.2, 0.4, 0.01), 50); // High ping
            break;

        case 'levelUp':
            playTone(523.25, 'triangle', 0.2, 0.4, 0.1); // C5
            setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.4, 0.1), 150); // E5
            setTimeout(() => playTone(783.99, 'triangle', 0.4, 0.5, 0.01), 300); // G5
            setTimeout(() => playTone(1046.50, 'triangle', 0.6, 0.6, 0.01), 450); // C6
            break;

        case 'click':
            playTone(600, 'sine', 0.05, 0.2, 0.01, 1.5); // Quick chirp up
            break;

        case 'open':
            playTone(150, 'sine', 0.2, 0.1, 0.01, 2.0); // Subtle low sweep up
            break;

        case 'waveStart':
            // Double drum hit
            playNoise(0.1, 0.5, 0.01);
            playTone(100, 'square', 0.1, 0.5, 0.01, 0.5);
            setTimeout(() => {
                playNoise(0.2, 0.6, 0.01);
                playTone(90, 'square', 0.2, 0.6, 0.01, 0.5);
            }, 150);
            break;

        case 'equip':
            playTone(1200, 'triangle', 0.05, 0.2, 0.01, 0.5); // Metallic clink
            playTone(2000, 'sine', 0.1, 0.1, 0.01);
            break;

        case 'spawnMonster':
            playNoise(0.15, 0.5, 0.01);
            playTone(150, 'sawtooth', 0.15, 0.4, 0.01, 0.5);
            break;

        case 'spawnChest':
            playTone(600, 'sine', 0.1, 0.3, 0.01, 1.2);
            playTone(800, 'sine', 0.15, 0.4, 0.01, 1.5);
            break;

        case 'spawnEvent':
            playTone(400, 'triangle', 0.1, 0.3, 0.01, 1.5);
            setTimeout(() => playTone(600, 'triangle', 0.15, 0.4, 0.01, 1.5), 50);
            break;

        // ─── EVENTS ───
        case 'eventGood':
            playTone(659.25, 'sine', 0.4, 0.3, 0.01); // E5
            setTimeout(() => playTone(880, 'sine', 0.6, 0.4, 0.01), 200); // A5
            break;

        case 'eventBad':
            playTone(300, 'sawtooth', 0.5, 0.3, 0.01, 0.8);
            setTimeout(() => playTone(280, 'sawtooth', 0.8, 0.4, 0.01, 0.8), 200); // Discordant
            break;

        case 'heal':
            // Arpeggio glissando
            for (let i = 0; i < 5; i++) {
                setTimeout(() => playTone(400 + i * 150, 'sine', 0.2, 0.2, 0.01), i * 40);
            }
            break;

        case 'trap':
            playNoise(0.2, 0.9, 0.01);
            playTone(150, 'sawtooth', 0.1, 0.5, 0.01, 0.3);
            break;

        case 'statusEffect':
            // Bubbling sound
            for (let i = 0; i < 4; i++) {
                setTimeout(() => playTone(300 + Math.random() * 200, 'sine', 0.1, 0.3, 0.01, 0.5), i * 80);
            }
            break;
    }
}
