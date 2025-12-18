import { GameState } from './game/GameState.js';
import { GameRenderer } from './game/GameRenderer.js';
import { UIManager } from './ui/UIManager.js';
import { DatabaseManager } from './game/DatabaseManager.js';
import { PanelManager } from './ui/PanelManager.js';
import { EditorManager } from './ui/EditorManager.js';

class Game {
    constructor() {
        this.db = new DatabaseManager();
        this.gameState = null;
        this.renderer = null;
        this.uiManager = null;
        this.panelManager = null;
        this.editorManager = null;
        this.isInitialized = false;
        this.lastTime = 0;
        this.gameLoopId = null;
    }

    async initialize() {
        try {
            console.log('Initializing game...');
            
            // Initialize database
            await this.db.initialize();
            console.log('Database initialized');
            
            // Create game state
            this.gameState = new GameState(this.db);
            console.log('Game state created');
            
            // Initialize renderer
            this.renderer = new GameRenderer(this.gameState);
            console.log('Renderer initialized');
            
            // Initialize panel manager
            this.panelManager = new PanelManager(this.gameState);
            const gameWorld = document.querySelector('.game-world');
            if (gameWorld) {
                this.panelManager.initialize(gameWorld);
                console.log('PanelManager initialized');
            }
            
            // Initialize UI manager
            this.uiManager = new UIManager(this.gameState, this.renderer, this.panelManager);
            console.log('UI Manager initialized');
            
            // Initialize editor manager
            this.editorManager = new EditorManager(this.gameState, this.uiManager, this.renderer);
            console.log('EditorManager initialized');
            
            // Spawn initial monsters
            this.spawnInitialMonsters();
            console.log('Initial monsters spawned');
            
            // Start game loop
            this.startGameLoop();
            console.log('Game loop started');
            
            this.isInitialized = true;
            console.log('✅ Game initialized successfully!');
            
            // Make instances globally available for debugging
            window.game = this;
            window.gameState = this.gameState;
            window.renderer = this.renderer;
            window.uiManager = this.uiManager;
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showError('Error initializing game. Check console for details.');
        }
    }

    spawnInitialMonsters() {
        for (let i = 0; i < 10; i++) {
            if (this.db.monsters.length > 0) {
                const template = this.db.monsters[Math.floor(Math.random() * this.db.monsters.length)];
                const x = Math.random() * (this.renderer.map[0].length * this.renderer.gridSize);
                const y = Math.random() * (this.renderer.map.length * this.renderer.gridSize);
                this.gameState.spawnMonster(template, x, y);
            }
        }
    }

    startGameLoop() {
        const gameLoop = (timestamp) => {
            if (!this.gameState || !this.renderer || !this.uiManager) {
                this.gameLoopId = requestAnimationFrame(gameLoop);
                return;
            }
            
            const deltaTime = (timestamp - this.lastTime) / 1000 || 0;
            this.lastTime = timestamp;
            
            try {
                // Update game state
                this.gameState.update(deltaTime);
                
                // Update camera
                this.renderer.updateCamera();
                
                // Render game
                this.renderer.render();
                
                // Update UI
                this.uiManager.updateUI();
            } catch (error) {
                console.error('Error in game loop:', error);
            }
            
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoopId = requestAnimationFrame(gameLoop);
    }

    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(233, 69, 96, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.zIndex = '10000';
        errorDiv.style.textAlign = 'center';
        errorDiv.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">Reload Game</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    const game = new Game();
    window.gameInstance = game;
    game.initialize();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.gameInstance) {
        window.gameInstance.gameState?.saveGame(true);
        window.gameInstance.stopGameLoop();
    }
});

// Export for module usage
export { Game };