// ==========================================
// GESTIONE COORTI SPRITE (NEMICI, OGGETTI E BOSS)
// ==========================================

let enemies = [];
let items = [];

const levelSpritesDatabase = {
    1: {
        // PIANO 1: Solo i 3 droni. La Regina apparirà dinamicamente alla loro morte!
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
        // PIANO 2: Solo i droni di pattuglia. La Regina apparirà alla fine.
        enemies: [
            { x: 4.5,  y: 3.5,  alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 11.5, y: 3.5,  alive: true, speed: 0.024, hitFrame: 0, type: 'drone', health: 1 },
            { x: 2.5,  y: 12.5, alive: true, speed: 0.028, hitFrame: 0, type: 'drone', health: 1 },
            { x: 13.5, y: 12.5, alive: true, speed: 0.030, hitFrame: 0, type: 'drone', health: 1 }
        ],
        items: [
            { x: 1.5,  y: 5.5,  type: 'medkit', active: true },
            { x: 14.5, y: 5.5,  type: 'ammo', active: true },
            { x: 7.5,  y: 7.5,  type: 'medkit', active: true },
            { x: 7.5,  y: 13.5, type: 'ammo', active: true }
        ]
    },
    3: {
        // PIANO 3: L'arena finale. Il BOSS è presente da subito.
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

// Funzione di rendering unificata ripristinata
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
            
            let bobbing = (sprite.type !== 'drone' && sprite.type !== 'boss' && sprite.type !== 'queen') ? Math.sin(globalAnimTime * 1.8) * 10 : 0;
            let droneSway = (sprite.type === 'drone' || sprite.type === 'boss' || sprite.type === 'queen') ? Math.sin(globalAnimTime * 2.2) * 6 : 0;

            let scale = (sprite.type === 'boss' || sprite.type === 'queen') ? 1.8 : 1.0;
            let spriteHeight = Math.abs(Math.floor(height / transformY)) * scale;
            let drawStartY = Math.max(0, -spriteHeight / 2 + height / 2 + bobbing + droneSway);
            let drawEndY = Math.min(height - 1, spriteHeight / 2 + height / 2 + bobbing + droneSway);

            let spriteWidth = Math.abs(Math.floor(height / transformY)) * scale;
            let drawStartX = Math.max(0, Math.floor(-spriteWidth / 2 + spriteScreenX));
            let drawEndX = Math.min(width - 1, Math.floor(spriteWidth / 2 + spriteScreenX));

            let midY = (drawStartY + drawEndY) / 2;
            let sHeight = drawEndY - drawStartY;

            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                if (transformY < zBuffer[stripe]) {
                    let relX = (stripe - drawStartX) / spriteWidth;

                    if (sprite.type === 'drone') {
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
                    else if (sprite.type === 'queen') {
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#ffffff' : '#2c3e50';
                        if (relX > 0.15 && relX < 0.85) ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.65);
                        if ((relX > 0.15 && relX < 0.30) || (relX > 0.70 && relX < 0.85)) {
                            if (sprite.hitFrame !== 1) ctx.fillStyle = '#8e44ad';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.22, 1, sHeight * 0.45);
                        }
                        if (relX > 0.40 && relX < 0.60) {
                            if (sprite.hitFrame !== 1) ctx.fillStyle = (Math.sin(globalAnimTime * 4) > 0) ? '#9b59b6' : '#5b2c6f';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.20, 1, sHeight * 0.55);
                        }
                        if (stripe > spriteScreenX - 6 && stripe < spriteScreenX + 6 && relX > 0.46 && relX < 0.54) {
                            ctx.fillStyle = '#e74c3c';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.32, 1, sHeight * 0.1);
                        }
                    }
                    else if (sprite.type === 'boss') {
                        ctx.fillStyle = (sprite.hitFrame === 1) ? '#ff0000' : '#112233';
                        if (relX > 0.20 && relX < 0.80) ctx.fillRect(stripe, drawStartY, 1, sHeight * 0.85);
                        if (relX > 0.45 && relX < 0.55 && sprite.hitFrame !== 1) {
                            ctx.fillStyle = '#ca6f1e';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.25, 1, sHeight * 0.4);
                        }
                        if (stripe > spriteScreenX - 12 && stripe < spriteScreenX + 12 && relX > 0.35 && relX < 0.65) {
                            if (Math.floor(stripe / 3) % 2 === 0) {
                                ctx.fillStyle = '#ff1a1a';
                                ctx.fillRect(stripe, drawStartY + sHeight * 0.08, 1, sHeight * 0.1);
                            }
                        }
                        if ((relX > 0.10 && relX <= 0.20) || (relX >= 0.80 && relX < 0.90)) {
                            ctx.fillStyle = '#7f8c8d';
                            ctx.fillRect(stripe, drawStartY + sHeight * 0.15, 1, sHeight * 0.4);
                        }
                    }
                    else if (sprite.type === 'folder') {
                        if (relX > 0.30 && relX < 0.70) {
                            ctx.fillStyle = '#2980b9'; 
                            ctx.fillRect(stripe, midY - sHeight * 0.2, 1, sHeight * 0.4);
                        }
                    }
                    else if (sprite.type === 'key') {
                        if (relX > 0.40 && relX < 0.60) {
                            ctx.fillStyle = '#f1c40f'; 
                            ctx.fillRect(stripe, midY - sHeight * 0.15, 1, sHeight * 0.35);
                        }
                    }
                    else if (sprite.type === 'medkit') {
                        if (relX > 0.44 && relX < 0.56) {
                            ctx.fillStyle = '#2c3e50'; ctx.fillRect(stripe, midY - sHeight * 0.24, 1, sHeight * 0.05);
                        }
                        if (relX > 0.28 && relX < 0.72) {
                            ctx.fillStyle = (relX < 0.34 || relX > 0.66) ? '#d5dbdb' : '#ffffff';
                            ctx.fillRect(stripe, midY - sHeight * 0.19, 1, sHeight * 0.38);
                        }
                    } 
                    else if (sprite.type === 'ammo') {
                        if (relX > 0.24 && relX < 0.76) {
                            ctx.fillStyle = '#2e4053'; ctx.fillRect(stripe, midY - sHeight * 0.16, 1, sHeight * 0.32);
                        }
                    }
                }
            }
        }
    });
}

LoadLevelSprites(1);
