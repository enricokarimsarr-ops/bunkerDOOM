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

// ==========================================
// RENDERING PROCEDURALE DEGLI SPRITE (RAYCASTING)
// ==========================================
function drawSprites(ctx, player, width, height, zBuffer, globalAnimTime) {
    let sprites = [];
    
    // Raccoglie gli elementi attivi sulla mappa
    items.forEach(item => { if (item.active) sprites.push({ x: item.x, y: item.y, type: item.type }); });
    enemies.forEach(enemy => { if (enemy.alive) sprites.push({ x: enemy.x, y: enemy.y, type: enemy.type, hitFrame: enemy.hitFrame }); });

    // Ordina gli sprite da dietro a davanti (Algoritmo del Pittore)
    sprites.sort((a, b) => {
        let distA = ((player.x - a.x) * (player.x - a.x) + (player.y - a.y) * (player.y - a.y));
        let distB = ((player.x - b.x) * (player.x - b.x) + (player.y - b.y) * (player.y - b.y));
        return distB - distA;
    });

    // Renderizza ogni singolo sprite visibile sul Canvas
    sprites.forEach(sprite => {
        let spriteX = sprite.x - player.x; 
        let spriteY = sprite.y - player.y;
        let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY); 

        if (transformY > 0) {
            let spriteScreenX = Math.floor((width / 2) * (1 + transformX / transformY));
            
            // Oscillazioni (Effetti fluttuanti industriali)
            let bobbing = (sprite.type !== 'drone' && sprite.type !== 'boss') ? Math.sin(globalAnimTime * 1.8) * 10 : 0;
            let droneSway = (sprite.type === 'drone' || sprite.type === 'boss') ? Math.sin(globalAnimTime * 2.2) * 6 : 0;

            let spriteHeight = Math.abs(Math.floor(height / transformY));
            let drawStartY = Math.max(0, -spriteHeight / 2 + height / 2 + bobbing + droneSway);
            let drawEndY = Math.min(height - 1, spriteHeight / 2 + height / 2 + bobbing + droneSway);

            let spriteWidth = Math.abs(Math.floor(height / transformY));
            let drawStartX = Math.max(0, Math.floor(-spriteWidth / 2 + spriteScreenX));
            let drawEndX = Math.min(width - 1, Math.floor(spriteWidth / 2 + spriteScreenX));

            let midY = (drawStartY + drawEndY) / 2;
            let sHeight = drawEndY - drawStartY;

            // Disegna lo sprite colonna per colonna, verificandone la profondità sul zBuffer
            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    let relX = (stripe - drawStartX) / spriteWidth;

                    if (sprite.type === 'drone') {
                        // DRONE MECCANICO CORAZZATO SEC 7
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#ff4d4d' : '#4d5656';
                        if (relX > 0.28 && relX < 0.72) ctx.fillRect(stripe, drawStartY + sHeight * 0.2, 1, sHeight * 0.6);
                        if (relX > 0.35 && relX < 0.65 && Math.floor(stripe / 4) % 2 === 0 && sprite.hitFrame !== 1) {
                            ctx.fillStyle = '#d4ac0d';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.3, 1, sHeight * 0.4);
                        }
                        if (stripe > spriteScreenX - 5 && stripe < spriteScreenX + 5) {
                            ctx.fillStyle = (Math.sin(globalAnimTime * 5) > 0) ? '#ff0000' : '#900c3f';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.42, 1, sHeight * 0.15);
                        }
                        if ((relX > 0.18 && relX < 0.28) || (relX > 0.72 && relX < 0.82)) {
                            ctx.fillStyle = '#2c3e50';
                            ctx.fillRect(stripe, midY, 1, sHeight * 0.3);
                        }
                    } 
                    else if (sprite.type === 'boss') {
                        // IL DIRETTORE GENERALE CORROTTO (Boss imponente e minaccioso)
                        // Alterna colori aziendali cibernetici e scuri se colpito
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#ff0000' : '#112233'; // Armatura scura o flash rosso
                        
                        // Monolite/Busto Cyber-Manageriale Principale
                        if (relX > 0.20 && relX < 0.80) {
                            ctx.fillRect(stripe, drawStartY, 1, sHeight * 0.85);
                        }
                        // Cravatta aziendale retroilluminata al plasma (Glow Arancione Aurelia Cement)
                        if (relX > 0.45 && relX < 0.55 && sprite.hitFrame !== 1) {
                            ctx.fillStyle = '#ca6f1e';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.25, 1, sHeight * 0.4);
                        }
                        // Visore a schermo sdoppiato rosso malvagio sul "capo"
                        if (stripe > spriteScreenX - 12 && stripe < spriteScreenX + 12 && relX > 0.35 && relX < 0.65) {
                            if (Math.floor(stripe / 3) % 2 === 0) {
                                ctx.fillStyle = '#ff1a1a';
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.08, 1, sHeight * 0.1);
                            }
                        }
                        // Spalline esoscheletriche idrauliche industriali
                        if ((relX > 0.10 && relX <= 0.20) || (relX >= 0.80 && relX < 0.90)) {
                            ctx.fillStyle = '#7f8c8d';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.4);
                        }
                    }
                    else if (sprite.type === 'medkit') {
                        // KIT MEDICO DI EMERGENZA
                        if (relX > 0.44 && relX < 0.56) {
                            ctx.fillStyle = '#2c3e50';
                            ctx.fillRect(stripe, midY - sHeight * 0.24, 1, sHeight * 0.05);
                        }
                        if (relX > 0.28 && relX < 0.72) {
                            ctx.fillStyle = (relX < 0.34 || relX > 0.66) ? '#d5dbdb' : '#ffffff';
                            ctx.fillRect(stripe, midY - sHeight * 0.19, 1, sHeight * 0.38);
                            let vCross = (relX > 0.46 && relX < 0.54);
                            let hCross = (relX > 0.38 && relX < 0.62);
                            ctx.fillStyle = '#e74c3c';
                            if (vCross) ctx.fillRect(stripe, midY - sHeight * 0.12, 1, sHeight * 0.24);
                            else if (hCross) ctx.fillRect(stripe, midY - sHeight * 0.04, 1, sHeight * 0.08);
                        }
                    } 
                    else if (sprite.type === 'ammo') {
                        // CASSA DI MUNIZIONI MILITARE
                        if (relX > 0.24 && relX < 0.76) {
                            ctx.fillStyle = (relX < 0.30 || relX > 0.70) ? '#1b2631' : '#2e4053';
                            ctx.fillRect(stripe, midY - sHeight * 0.16, 1, sHeight * 0.32);
                            if (relX > 0.30 && relX < 0.70) {
                                ctx.fillStyle = '#f1c40f';
                                ctx.fillRect(stripe, midY + sHeight * 0.09, 1, sHeight * 0.04);
                            }
                            if (relX > 0.40 && relX < 0.60) {
                                ctx.fillStyle = '#f39c12';
                                if (Math.floor(stripe / 3) % 2 === 0) {
                                    ctx.fillRect(stripe, midY - Math.floor(sHeight * 0.06), 1, Math.floor(sHeight * 0.13));
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

// Avviamo di base gli sprite dedicati al primo livello
LoadLevelSprites(1);
