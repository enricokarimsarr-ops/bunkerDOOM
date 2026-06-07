// ==========================================
// GESTIONE COORTI SPRITE (NEMICI, OGGETTI E BOSS)
// VERSIONE: OFFICE HORROR UPDATE
// ==========================================

let enemies = [];
let items = [];

// Database invariato per mantenere la compatibilità logica
const levelSpritesDatabase = {
    1: {
        enemies: [
            { x: 14.5, y: 1.5,  alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 8.5,  y: 5.5,  alive: true, speed: 0.020, hitFrame: 0, type: 'drone', health: 1 },
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
        enemies: [
            { x: 4.5,  y: 3.5,  alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 11.5, y: 3.5,  alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 2.5,  y: 13.5, alive: true, speed: 0.028, hitFrame: 0, type: 'drone', health: 1 }, 
            { x: 13.5, y: 13.5, alive: true, speed: 0.030, hitFrame: 0, type: 'drone', health: 1 }  
        ],
        items: [
            { x: 1.5,  y: 5.5,  type: 'medkit', active: true },
            { x: 14.5, y: 5.5,  type: 'ammo', active: true },
            { x: 7.5,  y: 7.5,  type: 'medkit', active: true },
            { x: 7.5,  y: 13.5, type: 'ammo', active: true }
        ]
    },
    3: {
        enemies: [
            { x: 8.5, y: 8.5, alive: true, speed: 0.034, hitFrame: 0, type: 'boss', health: 5 }
        ],
        items: [
            { x: 1.5,  y: 7.5,  type: 'medkit', active: true },
            { x: 14.5, y: 7.5,  type: 'ammo', active: true },
            { x: 7.5,  y: 1.5,  type: 'medkit', active: true },
            { x: 7.5,  y: 14.5, type: 'ammo', active: true }
        ]
    }
};

function LoadLevelSprites(levelNumber) {
    const levelData = levelSpritesDatabase[levelNumber];
    if (!levelData) return;
    enemies = levelData.enemies.map(enemy => ({ ...enemy }));
    items = levelData.items.map(item => ({ ...item }));
}

function respawnItem(item) {
    setTimeout(() => {
        if (typeof gameOver !== 'undefined' && gameOver) return;
        let spawned = false;
        while (!spawned) {
            let rx = Math.floor(Math.random() * 14) + 1;
            let ry = Math.floor(Math.random() * 14) + 1;
            if (typeof map !== 'undefined' && map[ry][rx] === 0) {
                item.x = rx + 0.5;
                item.y = ry + 0.5;
                item.active = true;
                spawned = true;
            }
        }
    }, 6000);
}

// ==========================================
// CORE RENDERING ENGINE: GRAFICA SPERIMENTALE CANVAS
// ==========================================
function drawSprites(ctx, player, width, height, zBuffer, globalAnimTime) {
    let sprites = [];
    items.forEach(item => { if (item.active) sprites.push({ x: item.x, y: item.y, type: item.type }); });
    enemies.forEach(enemy => { if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, type: enemy.type, hitFrame: enemy.hitFrame }); });

    sprites.sort((a, b) => {
        let distA = ((player.x - a.x) * (player.x - a.x) + (player.y - a.y) * (player.y - a.y));
        let distB = ((player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y));
        return distB - distA;
    });

    sprites.forEach(sprite => {
        let spriteX = sprite.x - player.x; 
        let spriteY = sprite.y - player.y;
        let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY); 

        if (transformY > 0) {
            let spriteScreenX = Math.floor((width / 2) * (1 + transformX / transformY));
            
            // Effetti di oscillazione differenziati
            let bobbing = (sprite.type === 'medkit' || sprite.type === 'ammo' || sprite.type === 'key') ? Math.sin(globalAnimTime * 1.8) * 8 : 0;
            let zombieSway = (sprite.type === 'drone') ? Math.sin(globalAnimTime * 1.5) * 3 : 0;
            let bossSway = (sprite.type === 'boss' || sprite.type === 'queen') ? Math.sin(globalAnimTime * 2.5) * 5 : 0;

            // Scale dimensionali
            let scale = 1.0;
            if (sprite.type === 'boss') scale = 2.0; // Ragno Segretaria enorme
            if (sprite.type === 'queen') scale = 1.7; // Responsabile imponente

            let spriteHeight = Math.abs(Math.floor(height / transformY)) * scale;
            let drawStartY = Math.max(0, -spriteHeight / 2 + height / 2 + bobbing + zombieSway + bossSway);
            let drawEndY = Math.min(height - 1, spriteHeight / 2 + height / 2 + bobbing + zombieSway + bossSway);

            let spriteWidth = Math.abs(Math.floor(height / transformY)) * scale;
            let drawStartX = Math.max(0, Math.floor(-spriteWidth / 2 + spriteScreenX));
            let drawEndX = Math.min(width - 1, Math.floor(spriteWidth / 2 + spriteScreenX));

            let sHeight = drawEndY - drawStartY;
            let midY = (drawStartY + drawEndY) / 2;

            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    let relX = (stripe - drawStartX) / spriteWidth; // Coordinata X relativa (0.0 a 1.0)

                    // ------------------------------------------
                    // NEMICO: ZOMBIE DA UFFICIO (ex Drone)
                    // ------------------------------------------
                    if (sprite.type === 'drone') {
                        // Colore flash colpo o colore base vestito (Giacca Grigia)
                        let suitColor = (sprite.hitFrame === 1) ? '#e74c3c' : '#566573';
                        let skinColor = (sprite.hitFrame === 1) ? '#ffcccc' : '#aab7b8'; // Pelle putrida

                        // Corpo/Giacca
                        if (relX > 0.20 && relX < 0.80) {
                            ctx.fillStyle = suitColor;
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.3, 1, sHeight * 0.7);
                        }
                        // Camicia Bianca (triangolo centrale)
                        if (relX > 0.42 && relX < 0.58) {
                            ctx.fillStyle = (sprite.hitFrame === 1) ? '#ff9999' : '#ffffff';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.35, 1, sHeight * 0.35);
                        }
                        // Cravatta Rossa
                        if (relX > 0.47 && relX < 0.53) {
                            ctx.fillStyle = (sprite.hitFrame === 1) ? '#800000' : '#c0392b';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.35, 1, sHeight * 0.45);
                        }
                        // Testa zombie
                        if (relX > 0.35 && relX < 0.65) {
                            ctx.fillStyle = skinColor;
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.05, 1, sHeight * 0.3);
                        }
                        // Occhi rossi spenti
                        if (stripe > spriteScreenX - 3 && stripe < spriteScreenX + 3 && relX > 0.40 && relX < 0.60) {
                            if (Math.sin(globalAnimTime * 2) > 0) { // Lampeggio lento
                                ctx.fillStyle = '#ff4d4d';
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.05);
                            }
                        }
                    } 
                    // ------------------------------------------
                    // MINI-BOSS PIANO: RESPONSABILE MUTANTE (ex Queen)
                    // ------------------------------------------
                    else if (sprite.type === 'queen') {
                        let coreColor = (sprite.hitFrame === 1) ? '#ffffff' : '#4a235a'; // Aura viola scuro
                        
                        // Silhouette Giacca elegante scura
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#e6b0aa' : '#17202a';
                        if (relX > 0.15 && relX < 0.85) ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.85);
                        
                        // Camicia e Cravatta di lusso (Oro/Nero)
                        if (relX > 0.40 && relX < 0.60) {
                            ctx.fillStyle = (sprite.hitFrame === 1) ? '#ffffff' : '#f4d03f'; // Cravatta oro
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.20, 1, sHeight * 0.60);
                        }

                        // Bagliore energetico interno (Aura mutante)
                        if (relX > 0.25 && relX < 0.75) {
                            ctx.fillStyle = coreColor;
                            // Disegna strisce orizzontali per effetto energia
                            if (Math.floor((stripe + globalAnimTime * 10) / 2) % 3 === 0) {
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.25, 1, sHeight * 0.5);
                            }
                        }
                        // Testa e Occhi Demoniaci
                        if (relX > 0.42 && relX < 0.58) {
                            ctx.fillStyle = coreColor;
                            ctx.fillRect(stripe, drawStartY, 1, sHeight * 0.2);
                            // Occhi rossi brillanti fisse
                            ctx.fillStyle = '#ff0000';
                            if ((relX > 0.44 && relX < 0.48) || (relX > 0.52 && relX < 0.56)) {
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.08, 1, sHeight * 0.05);
                            }
                        }
                    }
                    // ------------------------------------------
                    // BOSS FINALE: SEGRETARIA RAGNO (ex Boss)
                    // ------------------------------------------
                    else if (sprite.type === 'boss') {
                        // PARTE INFERIORE: RAGNO MECCANICO
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#ffcccc' : '#212f3c'; // Metallo scuro
                        
                        // Corpo centrale ragno
                        if (relX > 0.20 && relX < 0.80) {
                            ctx.fillRect(stripe, midY + sHeight * 0.1, 1, sHeight * 0.4);
                        }
                        
                        // Zampe meccaniche (Disegnate alle estremità X)
                        if (relX < 0.25 || relX > 0.75) {
                            ctx.fillStyle = (Math.sin(globalAnimTime * 4 + relX * 10) > 0) ? '#78281f' : '#212f3c'; // Movimento zampe rosso/scuro
                            ctx.fillRect(stripe, midY, 1, sHeight * 0.5);
                        }

                        // PARTE SUPERIORE: BUSTO UMANOIDE (Segretaria)
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#e74c3c' : '#aed6f1'; // Camicetta azzurra
                        if (relX > 0.35 && relX < 0.65) {
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.35);
                        }

                        // Testa con occhiali e capelli (chignon stilizzato)
                        if (relX > 0.42 && relX < 0.58) {
                            // Capelli castani
                            ctx.fillStyle = '#6e2c00';
                            ctx.fillRect(stripe, drawStartY, 1, sHeight * 0.1);
                            // Viso
                            ctx.fillStyle = (sprite.hitFrame === 1) ? '#ffffff' : '#f5b7b1';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.08, 1, sHeight * 0.12);
                            // Occhiali (linea scura)
                            ctx.fillStyle = '#000000';
                            if (relX > 0.44 && relX < 0.56 && Math.floor(globalAnimTime * 2) % 2 === 0) {
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.12, 1, sHeight * 0.02);
                            }
                        }
                    }
                    // ------------------------------------------
                    // OGGETTO: CHIAVE DELL'ASCENSORE (Stilizzata)
                    // ------------------------------------------
                    else if (sprite.type === 'key') {
                        ctx.fillStyle = '#f1c40f'; // Oro brillante
                        
                        // Impugnatura rotonda superiore
                        if (relX > 0.35 && relX < 0.65 && (relX < 0.40 || relX > 0.60 || stripe % 2 === 0)) {
                            ctx.fillRect(stripe, midY - sHeight * 0.4, 1, sHeight * 0.3);
                        }
                        // Stelo principale
                        if (relX > 0.46 && relX < 0.54) {
                            ctx.fillRect(stripe, midY - sHeight * 0.2, 1, sHeight * 0.6);
                        }
                        // Dentini della chiave (in basso a destra)
                        if (relX > 0.54 && relX < 0.65) {
                            if (Math.floor(stripe / 2) % 2 === 0) { // Dentini alternati
                                ctx.fillRect(stripe, midY + sHeight * 0.2, 1, sHeight * 0.15);
                                ctx.fillRect(stripe, midY + sHeight * 0.35, 1, sHeight * 0.1);
                            }
                        }
                    }
                    // ------------------------------------------
                    // OGGETTO: CASSA SALUTE (Cassa con Croce Rossa)
                    // ------------------------------------------
                    else if (sprite.type === 'medkit') {
                        // Corpo cassa bianco pulito
                        if (relX > 0.25 && relX < 0.75) {
                            ctx.fillStyle = '#ffffff'; 
                            ctx.fillRect(stripe, midY - sHeight * 0.25, 1, sHeight * 0.5);
                        }
                        
                        // Croce Rossa stilizzata
                        ctx.fillStyle = '#e74c3c'; 
                        // Braccio verticale croce
                        if (relX > 0.46 && relX < 0.54) {
                            ctx.fillRect(stripe, midY - sHeight * 0.18, 1, sHeight * 0.36);
                        }
                        // Braccio orizzontale croce
                        if (relX > 0.35 && relX < 0.65) {
                            ctx.fillRect(stripe, midY - sHeight * 0.05, 1, sHeight * 0.1);
                        }
                    } 
                    // ------------------------------------------
                    // OGGETTO: MUNIZIONI (Rivetti Gialli)
                    // ------------------------------------------
                    else if (sprite.type === 'ammo') {
                        // Scatola scura base
                        if (relX > 0.20 && relX < 0.80) {
                            ctx.fillStyle = '#2e4053'; // Blu scuro metallico
                            ctx.fillRect(stripe, midY - sHeight * 0.20, 1, sHeight * 0.4);
                        }
                        // Tre rivetti gialli verticali (lineette)
                        ctx.fillStyle = '#f1c40f'; // Giallo Rivetti
                        if ((relX > 0.30 && relX < 0.36) || (relX > 0.47 && relX < 0.53) || (relX > 0.64 && relX < 0.70)) {
                             // Disegna 2 piccoli segmenti per rivetto per dare idea forma
                             ctx.fillRect(stripe, midY - sHeight * 0.12, 1, sHeight * 0.1);
                             ctx.fillRect(stripe, midY + sHeight * 0.02, 1, sHeight * 0.1);
                        }
                    }
                }
            }
        }
    });
}

LoadLevelSprites(1);
