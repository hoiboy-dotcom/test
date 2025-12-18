export class DatabaseManager {
    constructor() {
        this.items = [];
        this.monsters = [];
        this.skills = [];
        this.events = [];
        this.classes = [];
        this.imageCache = new Map();
    }

    async initialize() {
        try {
            // Load data from JSON files
            await Promise.all([
                this.loadData('items'),
                this.loadData('monsters'),
                this.loadData('skills'),
                this.loadData('events'),
                this.loadData('classes')
            ]);
            
            // Load from localStorage if available
            this.loadFromLocalStorage();
            
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            this.initializeDefaultData();
        }
    }

    async loadData(type) {
        try {
            const response = await fetch(`data/${type}.json`);
            if (response.ok) {
                this[type] = await response.json();
                console.log(`Loaded ${type}: ${this[type].length} entries`);
            } else {
                console.warn(`Could not load ${type}.json, using empty array`);
                this[type] = [];
            }
        } catch (error) {
            console.warn(`Error loading ${type}.json:`, error);
            this[type] = [];
        }
    }

    initializeDefaultData() {
        // Default data if JSON files are not found
        this.items = [
            {
                "id": 1,
                "name": "Bronze Sword",
                "type": "weapon",
                "rarity": "common",
                "level": 1,
                "dropRate": 10,
                "width": 1,
                "height": 1,
                "image": "sword.png",
                "stats": {
                    "strength": 5,
                    "damage": "15-25"
                },
                "description": "A basic bronze sword.",
                "stackable": false
            }
        ];
        
        this.monsters = [
            {
                "id": 1,
                "name": "Goblin",
                "type": "goblin",
                "level": 1,
                "hp": 50,
                "damage": 10,
                "exp": 25,
                "dropRate": 30,
                "color": "#2d7d32",
                "image": "goblin.png"
            }
        ];
        
        // Add more defaults as needed
    }

    async getImageUrl(imageName, type = 'items') {
        if (!imageName) {
            console.warn('No image name provided');
            return this.createPlaceholderImage(type);
        }
        
        const cacheKey = `${type}/${imageName}`;
        
        // Return cached image if available
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }
        
        try {
            // Try to load from images folder
            const response = await fetch(`images/${type}/${imageName}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                this.imageCache.set(cacheKey, url);
                return url;
            } else {
                // If image not found, create a placeholder
                console.warn(`Image not found: images/${type}/${imageName}`);
                return this.createPlaceholderImage(type);
            }
        } catch (error) {
            console.warn(`Error loading image ${imageName}:`, error);
            return this.createPlaceholderImage(type);
        }
    }

    createPlaceholderImage(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Different colors for different types
        let color = '#533483';
        if (type === 'monsters') color = '#e94560';
        if (type === 'skills') color = '#4CAF50';
        if (type === 'characters') color = '#0f3460';
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(type.charAt(0).toUpperCase(), 32, 32);
        
        return canvas.toDataURL();
    }

    async getAvailableImages(type = 'items') {
        try {
            // In a real server setup, you would fetch from the server
            // For now, we'll return a list of expected images
            const expectedImages = {
                'items': ['sword.png', 'armor.png', 'helm.png', 'shield.png', 'potion_red.png', 'potion_blue.png', 'gloves.png'],
                'monsters': ['goblin.png', 'orc.png', 'skeleton.png', 'dragon.png', 'golden_dragon.png'],
                'skills': ['power_slash.png', 'healing.png', 'fireball.png', 'ice_arrow.png', 'lightning.png'],
                'characters': ['dark_knight.png', 'elf.png', 'wizard.png', 'summoner.png']
            };
            
            return expectedImages[type] || [];
        } catch (error) {
            console.warn(`Could not list images for ${type}:`, error);
            return [];
        }
    }

    getItemById(id) {
        return this.items.find(item => item.id === id);
    }

    getMonsterById(id) {
        return this.monsters.find(monster => monster.id === id);
    }

    getSkillById(id) {
        return this.skills.find(skill => skill.id === id);
    }

    getClassByName(name) {
        return this.classes.find(cls => cls.name === name);
    }

    getEventById(id) {
        return this.events.find(event => event.id === id);
    }

    addItem(itemData) {
        const newId = Math.max(...this.items.map(i => i.id), 0) + 1;
        const item = { id: newId, ...itemData };
        this.items.push(item);
        this.saveToLocalStorage('items');
        return item;
    }

    updateItem(id, updates) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...updates };
            this.saveToLocalStorage('items');
            return true;
        }
        return false;
    }

    deleteItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.saveToLocalStorage('items');
            return true;
        }
        return false;
    }

    saveToLocalStorage(key) {
        try {
            localStorage.setItem(`muOnlineDB_${key}`, JSON.stringify(this[key]));
        } catch (e) {
            console.error(`Error saving ${key} to localStorage:`, e);
        }
    }

    loadFromLocalStorage() {
        const keys = ['items', 'monsters', 'skills', 'events', 'classes'];
        keys.forEach(key => {
            const data = localStorage.getItem(`muOnlineDB_${key}`);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this[key] = parsed;
                        console.log(`Loaded ${key} from localStorage: ${parsed.length} entries`);
                    }
                } catch (e) {
                    console.error(`Error loading ${key} from localStorage:`, e);
                }
            }
        });
    }
}