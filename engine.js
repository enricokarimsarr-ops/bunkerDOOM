// ==========================================
// MOTORE GRAFICO, FISICA E LOGICA DI GIOCO (SURVIVAL EDITION)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const container = document.getElementById('canvas-container');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let zBuffer = new Array(width);
let isShooting = false;
let shootTimer = 0;
let gameOver = false;
let globalAnimTime = 0;

window.isElevatorLocked = true;
window.keyDropped = false;
window.queenSpawned = false;
window.isTransitioning = false;

container.addEventListener('click', () => {
    if (typeof initAudio === 'function') initAudio(); 
    if (!gameOver) canvas.requestPointerLock();
});

window.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Spacebar') shoot();
    if (gameOver && e.key.toLowerCase() === 'r') resetGame();
});
window.addEventListener('mousedown', e => {
    if (document.pointerLockElement === canvas && e.button === 0) shoot();
});

function shoot() {
    if (isShooting || gameOver) return;
    if (player.ammo <= 0) { if(typeof playDryClickSound === 'function') playDryClickSound(); return; }

    player.ammo--;
    document.getElementById('ammo').innerText = player.ammo;
    isShooting = true; 
    shootTimer = 6; 
    if(typeof playShootSound === 'function') playShootSound(); 

    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        let spriteX = enemy.x - player.x;
        let spriteY = enemy.y - player.y;
        let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

        if (transformY > 0) {
            let spriteScreenX = Math.floor((width / 2) * (1 + transformX / transformY));
            
            if (Math.abs(spriteScreenX - width / 2) < 55 && transformY < zBuffer[width / 2]) {
                enemy.health -= 1; 
                enemy.hitFrame = 1;
                setTimeout(() => { enemy.hitFrame = 0; }, 100);
                
                if (enemy.health <= 0) {
                    enemy.alive = false;
                    player.score++;
                    document.getElementById('score').innerText = player.score;
                    if(typeof playKillSound === 'function') playKillSound(); 
                    
                    if (enemy.type === 'drone') {
                        let aliveDrones = enemies.filter(e => e.alive && e.type === 'drone').length;
                        
                        if (aliveDrones === 0 && !window.queenSpawned && currentLevel < 3) {
                            window.queenSpawned = true;
                            enemies.push({ x: enemy.x, y: enemy.y, alive: true, speed: 0.035, hitFrame: 0, type: 'queen', health: 4 });
                        }
                    } 
                    else if (enemy.type === 'queen' || enemy.type === 'boss') {
                        if (!window.keyDropped) {
                            items.push({ x: enemy.x, y: enemy.y, type: 'key', active: true });
                            window.keyDropped = true;
                        }
                    }
                }
            }
        }
    });
}

function resetGame() {
    gameOver = false;
    player.health = 70; 
    player.shield = 0;  
    player.ammo = 10;
    player.score = 0; 
    player.x = 1.5; 
    player.y = 1.5; 
    player.dirX = 1.0; 
    player.dirY = 0.0; 
    player.planeX = 0.0; 
    player.planeY = 0.66;
    
    window.isElevatorLocked = true;
    window.keyDropped = false;
    window.queenSpawned = false;
    window.isTransitioning = false;
    
    if(typeof LoadCorporateLevel === 'function') LoadCorporateLevel(1);
    if(typeof LoadLevelSprites === 'function') LoadLevelSprites(1);

    document.getElementById('health').innerText = 70;
    document.getElementById('score').innerText = 0;
    document.getElementById('ammo').innerText = 10;
    document.getElementById('shield').innerText = 0;

    let transitionScreen = document.getElementById('floor-transition');
    if (transitionScreen) transitionScreen.classList.remove('active');

    canvas.requestPointerLock();
    update();
}

function update() {
    if (gameOver) return;
    globalAnimTime += 0.08;

    let shieldEl = document.getElementById('shield');
    if (shieldEl) shieldEl.innerText = Math.floor(player.shield || 0);

    let mapX = Math.floor(player.x);
    let mapY = Math.floor(player.y);
    if (map[mapY] && map[mapY][mapX] === 9) {
        if (!window.isElevatorLocked && !window.isTransitioning) {
            if (currentLevel < 3) {
                window.isTransitioning = true; 
                let transitionScreen = document.getElementById('floor-transition');
                if (transitionScreen) {
                    document.getElementById('transition-title').innerText = "PIANO " + currentLevel + " COMPLETATO";
                    document.getElementById('transition-subtitle').innerText = "ACCESSO AL PIANO " + (currentLevel + 1) + "... \nSblocco dei protocolli di sicurezza in corso.";
                    transitionScreen.classList.add('active');
                }

                setTimeout(() => {
                    let nextLevel = currentLevel + 1;
                    LoadCorporateLevel(nextLevel);
                    currentLevel = nextLevel; 
                    LoadLevelSprites(currentLevel);
                    
                    player.x = 1.5; 
                    player.y = 1.5;
                    
                    window.isElevatorLocked = true; 
                    window.keyDropped = false;
                    window.queenSpawned = false;
                    window.isTransitioning = false;
                    
                    if (transitionScreen) transitionScreen.classList.remove('active');
                }, 3000);

            } else {
                gameOver = true;
                document.exitPointerLock();
                drawVictoryScreen();
                return;
            }
        }
    }

    // CORREZIONE CRITICA: Mantiene in vita il loop di gioco durante i 3 secondi di transizione!
    if (window.isTransitioning) {
        render(); 
        if (!gameOver) requestAnimationFrame(update);
        return;
    }

    let moveSpeed = 0.05;
    let strafeX = -player.dirY;
    let strafeY = player.dirX;

    if (keys['w']) {
        let nextX = player.x + player.dirX * moveSpeed; let nextY = player.y + player.dirY * moveSpeed;
        if (map[Math.floor(player.y)][Math.floor(nextX)] === 0 || map[Math.floor(player.y)][Math.floor(nextX)] === 9) player.x = nextX;
        if (map[Math.floor(nextY)][Math.floor(player.x)] === 0 || map[Math.floor(nextY)][Math.floor(player.x)] === 9) player.y = nextY;
    }
    if (keys['s']) {
        let nextX = player.x - player.dirX * moveSpeed; let nextY = player.y - player.dirY * moveSpeed;
        if (map[Math.floor(player.y)][Math.floor(nextX)] === 0 || map[Math.floor(player.y)][Math.floor(nextX)] === 9) player.x = nextX;
        if (map[Math.floor(nextY)][Math.floor(player.x)] === 0 || map[Math.floor(nextY)][Math.floor(player.x)] === 9) player.y = nextY;
    }
    if (keys['a']) {
        let nextX = player.x - strafeX * moveSpeed; let nextY = player.y - strafeY * moveSpeed;
        if (map[Math.floor(player.y)][Math.floor(nextX)] === 0 || map[Math.floor(player.y)][Math.floor(nextX)] === 9) player.x = nextX;
        if (map[Math.floor(nextY)][Math.floor(player.x)] === 0 || map[Math.floor(nextY)][Math.floor(player.x)] === 9) player.y = nextY;
    }
    if (keys['d']) {
        let nextX = player.x + strafeX * moveSpeed; let nextY = player.y + strafeY * moveSpeed;
        if (map[Math.floor(player.y)][Math.floor(nextX)] === 0 || map[Math.floor(player.y)][Math.floor(nextX)] === 9) player.x = nextX;
        if (map[Math.floor(nextY)][Math.floor(player.x)] === 0 || map[Math.floor(nextY)][Math.floor(player.x)] === 9) player.y = nextY;
    }

    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        let dx = player.x - enemy.x; let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let isBossType = (enemy.type === 'boss' || enemy.type === 'queen');
        let attackRange = isBossType ? 0.6 : 0.42;
        let damage = isBossType ? 2.0 : 0.9;

        if (dist < attackRange) {
            let finalDamage = damage;
            if (player.shield > 0) {
                if (player.shield >= finalDamage) {
                    player.shield -= finalDamage;
                    finalDamage = 0;
                } else {
                    finalDamage -= player.shield;
                    player.shield = 0;
                }
            }
            
            player.health -= finalDamage;
            if (player.health <= 0) {
                player.health = 0; 
                gameOver = true; 
                if(typeof playDeathSound === 'function') playDeathSound(); 
                document.exitPointerLock();
            }
            document.getElementById('health').innerText = Math.floor(player.health);
        } else {
            if (dist < 12) { 
                let stepX = (dx / dist) * enemy.speed; let stepY = (dy / dist) * enemy.speed;
                if (map[Math.floor(enemy.y)][Math.floor(enemy.x + stepX)] === 0) enemy.x += stepX;
                if (map[Math.floor(enemy.y + stepY)][Math.floor(enemy.x)] === 0) enemy.y += stepY;
            }
        }
    });

    items.forEach(item => {
        if (!item.active) return;
        let idx = player.x - item.x; let idy = player.y - item.y;
        if (Math.sqrt(idx * idx + idy * idy) < 0.45) {
            item.active = false; 
            if(typeof playItemSound === 'function') playItemSound();
            
            if (item.type === 'medkit') {
                player.health = Math.min(100, player.health + 30);
                document.getElementById('health').innerText = Math.floor(player.health);
            } else if (item.type === 'ammo') {
                player.ammo += 12;
                document.getElementById('ammo').innerText = player.ammo;
            } else if (item.type === 'folder') {
                player.shield = Math.min(100, (player.shield || 0) + 25);
            } else if (item.type === 'key') {
                window.isElevatorLocked = false;
            }
            
            if (item.type !== 'key' && typeof respawnItem === 'function') {
                respawnItem(item);
            }
        }
    });

    if (isShooting) { shootTimer--; if (shootTimer <= 0) isShooting = false; }
    
    render();
    if (gameOver && player.health <= 0) drawGameOverScreen(); 
    else if (!gameOver) requestAnimationFrame(update);
}

function render() {
    ctx.fillStyle = '#252b30'; ctx.fillRect(0, 0, width, height / 2);
    ctx.fillStyle = '#343a40'; ctx.fillRect(0, height / 2, width, height / 2);

    for (let x = 0; x < width; x++) {
        let cameraX = 2 * x / width - 1; 
        let rayDirX = player.dirX + player.planeX * cameraX;
        let rayDirY = player.dirY + player.planeY * cameraX;
        let mapX = Math.floor(player.x); let mapY = Math.floor(player.y);
        let sideDistX, sideDistY;
        let deltaDistX = (rayDirX === 0) ? Infinity : Math.abs(1 / rayDirX);
        let deltaDistY = (rayDirY === 0) ? Infinity : Math.abs(1 / rayDirY);
        let perpWallDist, stepX, stepY, hit = 0, side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
        else             { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
        else             { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
            else                       { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (map[mapY] && map[mapY][mapX] > 0) hit = 1;
        }

        if (side === 0) perpWallDist = (sideDistX - deltaDistX);
        else            perpWallDist = (sideDistY - deltaDistY);
        zBuffer[x] = perpWallDist;

        let lineHeight = Math.floor(height / perpWallDist);
        let drawStart = Math.max(0, -lineHeight / 2 + height / 2);
        let drawEnd = Math.min(height - 1, lineHeight / 2 + height / 2);

        let wallX = (side === 0) ? player.y + perpWallDist * rayDirY : player.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);

        let gradient = ctx.createLinearGradient(0, drawStart, 0, drawEnd);
        
        if (map[mapY] && map[mapY][mapX] === 9) {
            let topColor = (side === 1) ? '#117a65' : '#1abc9c';
            gradient.addColorStop(0, topColor);
            gradient.addColorStop(0.5, '#0e6251');
            gradient.addColorStop(1, '#0b5345');
        } else if ((mapX + mapY) % 3 === 0 && wallX > 0.15 && wallX < 0.85) {
            let topColor = (side === 1) ? '#5e2c04' : '#7e3d09';
            let botColor = (side === 1) ? '#3e1c02' : '#5e2c04';
            gradient.addColorStop(0, topColor);
            gradient.addColorStop(0.5, '#8e4c19'); 
            gradient.addColorStop(1, botColor);
        } else {
            let baseConcrete = (side === 1) ? '#566573' : '#7f8c8d';
            let darkConcrete = (side === 1) ? '#2c3e50' : '#43515f';
            gradient.addColorStop(0, baseConcrete);
            gradient.addColorStop(0.35, baseConcrete);
            gradient.addColorStop(0.37, '#222222'); 
            gradient.addColorStop(0.40, baseConcrete);
            gradient.addColorStop(0.70, baseConcrete);
            gradient.addColorStop(0.72, '#2c3238'); 
            gradient.addColorStop(1, darkConcrete);
        }

        ctx.strokeStyle = gradient;
        ctx.beginPath(); ctx.moveTo(x, drawStart); ctx.lineTo(x, drawEnd); ctx.stroke();
    }

    if (typeof drawSprites === 'function') {
        drawSprites(ctx, player, width, height, zBuffer, globalAnimTime);
    }

    drawWeapon();
    drawMinimap();
    
    let curX = Math.floor(player.x);
    let curY = Math.floor(player.y);
    if (map[curY] && map[curY][curX] === 9 && window.isElevatorLocked) {
        ctx.save();
        ctx.fillStyle = 'rgba(120, 40, 31, 0.85)';
        ctx.fillRect(width / 2 - 240, height / 2 + 40, 480, 40);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(width / 2 - 240, height / 2 + 40, 480, 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 13px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("ASCENSORE BLOCCATO: UCCIDI LA REGINA E PRENDI LA CHIAVE!", width / 2, height / 2 + 64);
        ctx.restore();
    }
}

function drawWeapon() {
    ctx.save();
    if (isShooting) {
        ctx.fillStyle = 'rgba(230, 126, 34, 0.9)';
        ctx.beginPath(); ctx.arc(width / 2, height - 130, 50, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f9e79f';
        ctx.beginPath(); ctx.arc(width / 2, height - 130, 20, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#2e4053'; ctx.fillRect(width / 2 - 20, height - 90, 40, 95);
        ctx.fillStyle = '#1a252f'; ctx.fillRect(width / 2 - 10, height - 120, 20, 45);
    } else {
        ctx.fillStyle = '#5d6d7e'; ctx.fillRect(width / 2 - 16, height - 110, 32, 110);
        ctx.fillStyle = '#78281f'; ctx.fillRect(width / 2 - 20, height - 70, 4, 70);
        ctx.fillRect(width / 2 + 16, height - 70, 4, 70);
        ctx.fillStyle = '#2c3e50'; ctx.fillRect(width / 2 - 7, height - 130, 14, 45); 
    }
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.4)';
    ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2); ctx.lineTo(width / 2 + 10, height / 2);
    ctx.moveTo(width / 2, height / 2 - 10); ctx.lineTo(width / 2, height / 2 + 10);
    ctx.stroke(); ctx.restore();
}

function drawMinimap() {
    let size = 6; 
    ctx.fillStyle = 'rgba(26, 26, 26, 0.7)';
    ctx.fillRect(10, 10, map[0].length * size, map.length * size);

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] > 0) {
                ctx.fillStyle = (map[y][x] === 9) ? '#1abc9c' : '#566573'; 
                ctx.fillRect(10 + x * size, 10 + y * size, size - 1, size - 1);
            }
        }
    }

    ctx.fillStyle = '#e67e22'; 
    ctx.fillRect(10 + Math.floor(player.x * size) - 1, 10 + Math.floor(player.y * size) - 1, 3, 3);

    ctx.fillStyle = '#ff4d4d'; 
    enemies.forEach(e => {
        if (e.alive) ctx.fillRect(10 + Math.floor(e.x * size) - 1, 10 + Math.floor(e.y * size) - 1, 3, 3);
    });

    ctx.fillStyle = '#27ae60'; 
    items.forEach(i => {
        if (i.active) ctx.fillRect(10 + Math.floor(i.x * size) - 1, 10 + Math.floor(i.y * size) - 1, 2, 2);
    });
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(15, 15, 15, 0.9)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#78281f';
    ctx.font = "bold 40px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("CONNESSIONE INTERROTTA", width / 2, height / 2 - 20);
    ctx.fillStyle = '#d5dbdb';
    ctx.font = "18px 'Courier New'";
    ctx.fillText("Struttura compromessa. Premi 'R' per riavviare il drone", width / 2, height / 2 + 30);
}

function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(15, 15, 15, 0.9)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f1c40f';
    ctx.font = "bold 40px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("SISTEMA RIPRISTINATO", width / 2, height / 2 - 20);
    ctx.fillStyle = '#d5dbdb';
    ctx.font = "18px 'Courier New'";
    ctx.fillText("Regina eliminata. Struttura in sicurezza.", width / 2, height / 2 + 20);
    ctx.fillText("Premi 'R' per ricominciare", width / 2, height / 2 + 50);
}

update();
