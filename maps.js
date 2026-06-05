// ==========================================
// CONFIGURAZIONE DELLE MAPPE E DEI LIVELLI (DOOM D'UFFICIO)
// ==========================================

// Il livello aziendale da cui parte il drone del giocatore
let currentLevel = 1;

// Struttura dei 3 piani del Bunker
// 1 = Muro di Cemento/Cartongesso, 0 = Spazio vuoto corridoio, 9 = Ascensore per il piano successivo
const gameMaps = {
    1: [ 
        // PIANO 1: REPARTO AMMINISTRAZIONE (Il tuo labirinto originale)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,1],
        [1,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1],
        [1,0,1,0,1,1,1,1,0,1,1,0,1,1,0,1],
        [1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,1],
        [1,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,0,1,1,1,1,1,1,0,1,1,1,0,1],
        [1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1],
        [1,1,1,0,1,0,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,1,0,1,0,0,0,0,1,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,1,0,1,1,1,9,1], // Il '9' è l'ascensore bloccato per scendere
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    2: [
        // PIANO 2: SALE RIUNIONI E OPEN SPACE SINDACALE
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
        [1,0,1,0,0,1,0,0,0,0,1,0,0,1,0,1],
        [1,0,1,0,0,1,1,1,1,1,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,1],
        [1,0,0,1,0,1,0,0,0,0,1,0,1,0,0,1],
        [1,0,0,1,0,1,0,1,1,0,1,0,1,0,0,1],
        [1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1],
        [1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1],
        [1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1],
        [1,0,0,0,0,0,1,9,0,1,0,0,0,0,0,1], // Ascensore di metà percorso
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    3: [
        // PIANO 3: DIREZIONE GENERALE (L'arena finale del Direttore Boss)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // Grande ufficio centrale vuoto
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // Qui comparirà il Boss Finale!
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,9,1], // Computer centrale di sblocco gioco
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
};

// Manteniamo la variabile globale 'map' attiva sul livello corrente
// così tutto il codice del motore grafico continuerà a leggerla senza rompersi
let map = gameMaps[currentLevel];

// Funzione di servizio per effettuare il cambio di piano in sicurezza
function LoadCorporateLevel(levelNumber) {
    if (gameMaps[levelNumber]) {
        currentLevel = levelNumber;
        map = gameMaps[currentLevel];
        return true;
    }
    return false;
}
