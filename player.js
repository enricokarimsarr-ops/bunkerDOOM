// ==========================================
// GIOCATORE E CONTROLLI (MOVIMENTO E STATISTICHE)
// ==========================================

// Le statistiche e la posizione iniziale del nostro protagonista nel livello 1
// MODIFICATO: Risorse ridotte per la modalità Survival + Nuova variabile Shield (Scudo)
let player = { 
    x: 1.5, 
    y: 1.5, 
    dirX: 1.0, 
    dirY: 0.0, 
    planeX: 0.0, 
    planeY: 0.66, 
    health: 70,     // Partenza Survival: 70 di vita anziché 100
    shield: 0,      // NUOVO: Lo scudo parte a 0% e assorbirà i danni
    score: 0, 
    ammo: 10        // Partenza Survival: 10 Rivetti anziché 20
};

// Variabili per tracciare i tasti premuti e la sensibilità del mouse
let keys = {};
let mouseSensitivity = 0.0025;

// GESTIONE DEL MOUSE (Rotazione della visuale 3D)
document.addEventListener('mousemove', e => {
    // Nota: 'canvas' e 'gameOver' saranno definite nel motore principale (engine.js),
    // ma JavaScript ci permette di usarle qui perché questo evento scatterà solo durante il gioco!
    let canvas = document.getElementById('gameCanvas');
    if (document.pointerLockElement === canvas && typeof gameOver !== 'undefined' && !gameOver) {
        let mouseX = e.movementX;
        let rotSpeed = mouseX * mouseSensitivity;
        
        // Calcoli matematici per ruotare la telecamera del giocatore (Raycasting)
        let oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
        player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
        
        let oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
        player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
    }
});

// GESTIONE DELLA TASTIERA (Traccia quando premi o rilasci W, A, S, D)
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});
