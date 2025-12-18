export class GameRenderer {
    constructor(gameState) {
        this.gameState = gameState;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
        this.gridSize = 40;
        this.sprites = {};
        this.tileSprites = {};
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.mouse = { x: 0, y: 0, down: false };
        this.map = this.generateMap(100, 100);
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.loadSprites();
        console.log('GameRenderer initialized');
    }
    
    resizeCanvas() {
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
        }
        
        if (this.minimapCanvas && this.minimapCanvas.parentElement) {
            this.minimapCanvas.width = this.minimapCanvas.parentElement.clientWidth;
            this.minimapCanvas.height = this.minimapCanvas.parentElement.clientHeight;
        }
    }
    
    loadSprites() {
        this.sprites.player = this.createPlayerSprite();
        this.tileSprites = this.createTileSprites();
    }
    
    createPlayerSprite() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 48;
        
        // Body
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(8, 8, 16, 24);
        
        // Head
        ctx.fillStyle = '#ffd699';
        ctx.fillRect(12, 4, 8, 8);
        
        // Weapon
        ctx.fillStyle = '#999999';
        ctx.fillRect(24, 8, 4, 20);
        
        // Weapon tip
        ctx.fillStyle = '#e94560';
        ctx.fillRect(28, 8, 2, 12);
        
        return canvas;
    }
    
    createMonsterSprite(color = '#ff5252') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;
        
        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(16, 16, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 10, 4, 4);
        ctx.fillRect(18, 10, 4, 4);
        
        return canvas;
    }
    
    createTileSprites() {
        const tiles = {};
        const types = ['grass', 'stone', 'water', 'lava', 'sand'];
        
        types.forEach(type => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.gridSize;
            canvas.height = this.gridSize;
            
            switch(type) {
                case 'grass': ctx.fillStyle = '#2d5a27'; break;
                case 'stone': ctx.fillStyle = '#666666'; break;
                case 'water': ctx.fillStyle = '#1e88e5'; break;
                case 'lava': ctx.fillStyle = '#ff5722'; break;
                case 'sand': ctx.fillStyle = '#ffd54f'; break;
            }
            
            ctx.fillRect(0, 0, this.gridSize, this.gridSize);
            
            // Add some texture
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * this.gridSize;
                const y = Math.random() * this.gridSize;
                const size = Math.random() * 4 + 2;
                ctx.fillRect(x, y, size, size);
            }
            
            tiles[type] = canvas;
        });
        
        return tiles;
    }
    
    generateMap(width, height) {
        const map = [];
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                const type = Math.random() < 0.7 ? 'grass' : 
                            Math.random() < 0.8 ? 'stone' : 
                            Math.random() < 0.9 ? 'sand' : 'water';
                map[y][x] = { type, objects: [] };
            }
        }
        
        // Add some lava patches
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * (width - 20)) + 10;
            const y = Math.floor(Math.random() * (height - 20)) + 10;
            const size = Math.floor(Math.random() * 8) + 5;
            
            for (let dy = -size; dy <= size; dy++) {
                for (let dx = -size; dx <= size; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        if (Math.sqrt(dx*dx + dy*dy) <= size) {
                            map[ny][nx].type = 'lava';
                        }
                    }
                }
            }
        }
        
        return map;
    }
    
    updateCamera() {
        const player = this.gameState.player;
        const targetX = player.position.x - this.canvas.width / 2;
        const targetY = player.position.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Clamp camera to map bounds
        const maxX = this.map[0].length * this.gridSize - this.canvas.width;
        const maxY = this.map.length * this.gridSize - this.canvas.height;
        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
    }
    
    render() {
        this.clearCanvas();
        this.renderMap();
        this.renderMonsters();
        this.renderPlayer();
        this.renderUI();
        
        if (this.minimapCtx) {
            this.renderMinimap();
        }
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderMap() {
        const startX = Math.max(0, Math.floor(this.camera.x / this.gridSize));
        const startY = Math.max(0, Math.floor(this.camera.y / this.gridSize));
        const endX = Math.min(this.map[0].length, startX + Math.ceil(this.canvas.width / this.gridSize) + 1);
        const endY = Math.min(this.map.length, startY + Math.ceil(this.canvas.height / this.gridSize) + 1);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.map[y][x];
                const screenX = x * this.gridSize - this.camera.x;
                const screenY = y * this.gridSize - this.camera.y;
                
                if (tile && this.tileSprites[tile.type]) {
                    this.ctx.drawImage(
                        this.tileSprites[tile.type], 
                        screenX, 
                        screenY, 
                        this.gridSize, 
                        this.gridSize
                    );
                }
            }
        }
    }
    
    renderPlayer() {
        const player = this.gameState.player;
        const screenX = player.position.x - this.camera.x;
        const screenY = player.position.y - this.camera.y;
        
        // Draw player sprite
        this.ctx.drawImage(this.sprites.player, screenX - 16, screenY - 24, 32, 48);
        
        // Draw player name and level
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Lv.${player.level} ${player.class}`, screenX, screenY - 30);
        
        // Draw HP bar
        const hpPercent = player.hp.current / player.hp.max;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(screenX - 20, screenY - 35, 40, 5);
        this.ctx.fillStyle = '#ff5252';
        this.ctx.fillRect(screenX - 20, screenY - 35, 40 * hpPercent, 5);
    }
    
    renderMonsters() {
        this.gameState.monsters.forEach(monster => {
            if (monster.hp <= 0) return;
            
            const screenX = monster.x - this.camera.x;
            const screenY = monster.y - this.camera.y;
            
            // Create monster sprite if not exists
            if (!monster.sprite) {
                monster.sprite = this.createMonsterSprite(monster.color);
            }
            
            // Draw monster
            if (monster.sprite) {
                this.ctx.drawImage(monster.sprite, screenX - 16, screenY - 16, 32, 32);
            }
            
            // Draw monster info
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Lv.${monster.level} ${monster.name}`, screenX, screenY - 25);
            
            // Draw HP bar
            const hpPercent = monster.hp / monster.maxHp;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(screenX - 15, screenY - 20, 30, 4);
            this.ctx.fillStyle = '#ff5252';
            this.ctx.fillRect(screenX - 15, screenY - 20, 30 * hpPercent, 4);
        });
    }
    
    renderUI() {
        // Draw auto-target indicator
        if (this.gameState.player.autoTarget) {
            const monster = this.gameState.player.autoTarget;
            const screenX = monster.x - this.camera.x;
            const screenY = monster.y - this.camera.y;
            
            this.ctx.strokeStyle = '#e94560';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    renderMinimap() {
        const ctx = this.minimapCtx;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        
        // Clear minimap
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        const mapWidth = this.map[0].length * this.gridSize;
        const mapHeight = this.map.length * this.gridSize;
        const scaleX = width / mapWidth;
        const scaleY = height / mapHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Draw map tiles (simplified)
        for (let y = 0; y < this.map.length; y += 4) {
            for (let x = 0; x < this.map[0].length; x += 4) {
                const tile = this.map[y][x];
                if (tile) {
                    switch(tile.type) {
                        case 'grass': ctx.fillStyle = '#2d5a27'; break;
                        case 'stone': ctx.fillStyle = '#666666'; break;
                        case 'water': ctx.fillStyle = '#1e88e5'; break;
                        case 'lava': ctx.fillStyle = '#ff5722'; break;
                        case 'sand': ctx.fillStyle = '#ffd54f'; break;
                    }
                    ctx.fillRect(x * this.gridSize * scale, y * this.gridSize * scale, 4, 4);
                }
            }
        }
        
        // Draw player
        const player = this.gameState.player;
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(player.position.x * scale, player.position.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw monsters
        ctx.fillStyle = '#ff5252';
        this.gameState.monsters.forEach(monster => {
            ctx.beginPath();
            ctx.arc(monster.x * scale, monster.y * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    screenToWorld(x, y) {
        return {
            x: x + this.camera.x,
            y: y + this.camera.y
        };
    }
    
    worldToScreen(x, y) {
        return {
            x: x - this.camera.x,
            y: y - this.camera.y
        };
    }
}