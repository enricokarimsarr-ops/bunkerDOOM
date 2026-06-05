// ==========================================
// AUDIO ENGINE (CONSERVA IL RITMO HEAVY METAL)
// ==========================================
let audioCtx = null;
let musicInterval = null;
let masterGain = null;
let distortionNode = null;

function makeDistortionCurve(amount) {
    let k = typeof amount === 'number' ? amount : 50;
    let n_samples = 44100;
    let curve = new Float32Array(n_samples);
    let deg = Math.PI / 180;
    for (let i = 0 ; i < n_samples; ++i ) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
    
    distortionNode = audioCtx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(140);
    distortionNode.oversampling = '4x';
    distortionNode.connect(masterGain);
    
    startDoomSoundtrack();
}

function startDoomSoundtrack() {
    if (musicInterval) clearInterval(musicInterval);
    const riff = [41.20, 41.20, 0, 41.20, 41.20, 48.99, 41.20, 55.00, 41.20, 41.20, 0, 41.20, 46.25, 41.20, 38.89, 36.71];
    let step = 0;
    musicInterval = setInterval(() => {
        if (gameOver || !audioCtx) return;
        let currentNote = riff[step % riff.length];
        let subStep = step % 16;
        if (currentNote > 0) {
            playHeavyTone(currentNote, 0.14, 'sawtooth', 0.50);
            playTone(currentNote * 0.5, 0.16, 'triangle', 0.80);
        }
        if (subStep === 0 || subStep === 4 || subStep === 8 || subStep === 12) playKickDrum();
        if (subStep === 4 || subStep === 12) playSnareDrum();
        step++;
    }, 135);
}

function playHeavyTone(freq, duration, type, volume) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gainNode); gainNode.connect(distortionNode);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function playTone(freq, duration, type, volume) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gainNode); gainNode.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function playKickDrum() {
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gainNode); gainNode.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {}
}

function playSnareDrum() {
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gainNode); gainNode.connect(distortionNode);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
}

function playShootSound() {
    if (!audioCtx) return;
    try {
        let osc1 = audioCtx.createOscillator();
        let osc2 = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
        osc2.type = 'triangle'; osc2.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc2.frequency.linearRampToValueAtTime(10, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.9, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc1.connect(gainNode); osc2.connect(gainNode); gainNode.connect(masterGain);
        osc1.start(); osc2.start(); osc1.stop(audioCtx.currentTime + 0.3); osc2.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

function playDryClickSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(90, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gainNode); gainNode.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
}

function playItemSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        osc.frequency.setValueAtTime(520, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gainNode); gainNode.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
}

function playKillSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(20, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gainNode); gainNode.connect(distortionNode);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } catch(e) {}
}

function playDeathSound() {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(5, audioCtx.currentTime + 1.8);
        gainNode.gain.setValueAtTime(0.9, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
        osc.connect(gainNode); gainNode.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 1.8);
    } catch(e) {}
}
