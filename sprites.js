// ==========================================
// GESTIONE COORTI SPRITE (NEMICI, OGGETTI E BOSS)
// ==========================================

// Array dinamici usati dal motore grafico e logico durante la partita
let enemies = [];
let items = [];

// Il Database dei tre piani aziendali del Bunker
const levelSpritesDatabase = {
    1: {
        // PIANO 1: I tuoi 3 Droni originali e le 4 risorse storiche
        enemies: [
            { x: 14.5, y: 1.5, alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 8.5,  y: 5.5, alive: true, speed: 0.020, hitFrame: 0, type: 'drone', health: 1 },
            { x: 13.5, y: 13.5, alive: true, speed: 0.028, hitFrame: 0, type: 'drone', health: 1 }
        ],
        items: [
            { x: 4.5, y: 1.5, type: 'medkit', active: true },
            { x: 1.5, y: 13.5, type: 'ammo', active: true },
            { x: 9.5, y: 9.5, type: 'medkit', active: true },
            { x: 14.5, y: 7.5, type: 'ammo', active: true }
        ]
    },
    2: {
        // PIANO 2: Più droni, posizionati strategicamente nelle sale riunioni
        enemies: [
            { x: 4.5, y: 3.5, alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 11.5, y: 3.5, alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 2.5, y: 12.5, alive: true, speed: 0.028, hitFrame: 0, type: 'drone', health: 1 },
            { x: 13.5, y: 12.5, alive: true, speed: 0.030, hitFrame: 0, type: 'drone', health: 1 }
        ],
        items: [
            { x: 1.5, y: 5.5, type: 'medkit', active: true },
            { x: 14.5, y: 5.5, type: 'ammo', active: true },
            { x: 7.5, y: 7.5, type: 'medkit', active: true },
            { x: 7.5, y: 13.5, type: 'ammo', active: true }
        ]
    },
    3: {
        // PIANO 3: L'arena finale. Pochissimi oggetti e il BOSS "Il Direttore Generale Corrotto"
        enemies: [
            { x: 8.5, y: 8.5, alive: true, speed: 0.034, hitFrame: 0, type: 'boss', health: 5 } // Ha 5 punti vita!
        ],
        items: [
            { x: 1.5, y: 7.5, type: 'medkit', active: true },
            { x: 14.5, y: 7.5, type: 'ammo', active: true },
            { x: 7.5, y: 1.5, type: 'medkit', active: true },
            { x: 7.5, y: 14.5, type: 'ammo', active: true }
        ]
    }
};

// Funzione intelligente per generare i nemici e gli oggetti corretti del livello
function LoadLevelSprites(levelNumber) {
    const levelData = levelSpritesDatabase[levelNumber];
    if (!levelData) return;

    // Eseguiamo una copia pulita dei dati per poter resettare il gioco senza bug
    enemies = levelData.enemies.map(enemy => ({ ...enemy }));
    items = levelData.items.map(item => ({ ...item }));
}

// Funzione automatica di rigenerazione delle risorse raccolte
function respawnItem(item) {
    setTimeout(() => {
        if (typeof gameOver !== 'undefined' && gameOver) return;
        let spawned = false;
        while (!spawned) {
            let rx = Math.floor(Math.random() * 14) + 1;
            let ry = Math.floor(Math.random() * 14) + 1;
            
            // Controlla se la cella è vuota basandosi sulla mappa corrente di maps.js
            if (typeof map !== 'undefined' && map[ry][rx] === 0) {
                item.x = rx + 0.5;
                item.y = ry + 0.5;
                item.active = true;
                spawned = true;
            }
        }
    }, 6000); // Rispawna dopo 6 secondi in un punto sicuro a caso
}

// Avviamo di base gli sprite dedicati al primo livello
LoadLevelSprites(1);
