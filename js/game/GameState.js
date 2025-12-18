export class GameState {
    constructor(db) {
        this.db = db;
        this.player = this.initializePlayer();
        this.inventory = { items: Array(64).fill(null), size: 64 };
        this.monsters = [];
        this.autoFight = true;
        this.autoMove = true;
        this.gameTime = 0;
        this.lastSave = Date.now();
        this.chatMessages = [];
        this.chatConfig = { system: true, loot: true, exp: true, level: true, equip: true };
        this.lastUpdate = 0;
        
        this.initializeStartingItems();
        console.log('GameState initialized');
    }

    initializePlayer() {
        const savedData = localStorage.getItem('muOnlineSave');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.player) {
                    console.log('Loaded saved player data');
                    return data.player;
                }
            } catch (e) {
                console.error('Error loading saved player:', e);
            }
        }
        
        console.log('Creating default player');
        return this.createDefaultPlayer();
    }
    
    createDefaultPlayer() {
        return {
            level: 1,
            class: 'Dark Knight',
            hp: { current: 50, max: 50 },
            mp: { current: 20, max: 20 },
            xp: { current: 0, max: 100 },
            stats: { 
                strength: 20, 
                agility: 15, 
                vitality: 25, 
                energy: 10, 
                accuracy: 85, 
                critical: 5, 
                attackSpeed: 1.2, 
                moveSpeed: 100 
            },
            equipment: { 
                weapon: null, 
                armor: null, 
                helm: null, 
                gloves: null, 
                pants: null, 
                boots: null, 
                ring1: null, 
                ring2: null, 
                amulet: null, 
                wings: null, 
                pet: null, 
                shield: null 
            },
            position: { x: 400, y: 300 },
            autoTarget: null,
            learnedSkills: [1, 2],
            image: null
        };
    }
    
    initializeStartingItems() {
        const playerClass = this.db.getClassByName(this.player.class);
        const startingItems = [];
        
        if (playerClass && playerClass.startingItems) {
            playerClass.startingItems.forEach(itemId => {
                const itemTemplate = this.db.getItemById(itemId);
                if (itemTemplate) {
                    startingItems.push({ ...itemTemplate });
                }
            });
        } else {
            // Default starting items
            const defaultItems = [1, 2, 4, 5];
            defaultItems.forEach(itemId => {
                const itemTemplate = this.db.getItemById(itemId);
                if (itemTemplate) {
                    startingItems.push({ ...itemTemplate });
                }
            });
        }
        
        // Fill inventory with starting items
        startingItems.forEach((item, index) => {
            if (index < this.inventory.size) {
                this.inventory.items[index] = item;
            }
        });
        
        // Auto-equip starting items
        this.autoEquipStartingItems();
    }
    
    autoEquipStartingItems() {
        this.inventory.items.forEach(item => {
            if (item) {
                switch(item.type) {
                    case 'weapon': 
                        if (!this.player.equipment.weapon) {
                            this.player.equipment.weapon = item;
                            this.removeItemFromInventory(item);
                        }
                        break;
                    case 'armor': 
                        if (!this.player.equipment.armor) {
                            this.player.equipment.armor = item;
                            this.removeItemFromInventory(item);
                        }
                        break;
                    case 'helm': 
                        if (!this.player.equipment.helm) {
                            this.player.equipment.helm = item;
                            this.removeItemFromInventory(item);
                        }
                        break;
                    case 'gloves': 
                        if (!this.player.equipment.gloves) {
                            this.player.equipment.gloves = item;
                            this.removeItemFromInventory(item);
                        }
                        break;
                }
            }
        });
    }
    
    removeItemFromInventory(itemToRemove) {
        const index = this.inventory.items.findIndex(item => 
            item && item.id === itemToRemove.id
        );
        if (index !== -1) {
            this.inventory.items[index] = null;
        }
    }
    
    calculateDerivedStats() {
        const str = this.player.stats.strength;
        const agi = this.player.stats.agility;
        const vit = this.player.stats.vitality;
        const ene = this.player.stats.energy;
        
        let damageMin = Math.floor(str * 0.5 + agi * 0.2);
        let damageMax = Math.floor(str * 0.7 + agi * 0.3);
        let defense = Math.floor(vit * 0.5 + agi * 0.2);
        let accuracy = 85 + agi * 0.1;
        let critical = 5 + agi * 0.05;
        
        // Apply equipment bonuses
        Object.values(this.player.equipment).forEach(item => {
            if (item && item.stats) {
                if (item.stats.damage) {
                    const [min, max] = item.stats.damage.split('-').map(Number);
                    damageMin += min;
                    damageMax += max;
                }
                if (item.stats.defense) defense += item.stats.defense;
                if (item.stats.accuracy) accuracy += item.stats.accuracy;
                if (item.stats.critical) critical += item.stats.critical;
                if (item.stats.strength) {
                    damageMin += item.stats.strength * 0.5;
                    damageMax += item.stats.strength * 0.7;
                }
                if (item.stats.agility) {
                    accuracy += item.stats.agility * 0.1;
                    critical += item.stats.agility * 0.05;
                }
                if (item.stats.vitality) {
                    defense += item.stats.vitality * 0.5;
                }
            }
        });
        
        const hpMax = 50 + vit * 2;
        const mpMax = 20 + ene * 3;
        
        // Update player's max HP/MP
        this.player.hp.max = hpMax;
        this.player.mp.max = mpMax;
        
        // Ensure current HP/MP doesn't exceed max
        this.player.hp.current = Math.min(this.player.hp.current, hpMax);
        this.player.mp.current = Math.min(this.player.mp.current, mpMax);
        
        return {
            damage: `${damageMin}-${damageMax}`,
            defense: defense,
            accuracy: Math.min(95, Math.floor(accuracy)),
            critical: Math.min(50, critical),
            hpMax: hpMax,
            mpMax: mpMax,
            attackSpeed: this.player.stats.attackSpeed,
            moveSpeed: this.player.stats.moveSpeed
        };
    }
    
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // Auto-save every 30 seconds
        if (Date.now() - this.lastSave > 30000) {
            this.saveGame(true);
            this.lastSave = Date.now();
        }
        
        // Update monster AI
        this.updateMonsters(deltaTime);
    }
    
    updateMonsters(deltaTime) {
        // Simple monster AI - move toward player
        this.monsters.forEach(monster => {
            if (monster.hp <= 0) return;
            
            const dx = this.player.position.x - monster.x;
            const dy = this.player.position.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 400 && distance > 40) {
                monster.x += (dx / distance) * 1.5;
                monster.y += (dy / distance) * 1.5;
            }
            
            // Attack if close enough
            if (distance < 40) {
                const attackCooldown = 1500; // 1.5 seconds
                if (!monster.lastAttack || Date.now() - monster.lastAttack > attackCooldown) {
                    this.takeDamage(monster.damage);
                    monster.lastAttack = Date.now();
                }
            }
        });
        
        // Remove dead monsters
        this.monsters = this.monsters.filter(monster => monster.hp > 0);
    }
    
    addChatMessage(text, type = 'system') {
        const msg = { 
            text, 
            type, 
            timestamp: Date.now(),
            displayTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        this.chatMessages.push(msg);
        
        // Keep only last 100 messages
        if (this.chatMessages.length > 100) {
            this.chatMessages.shift();
        }
        
        // Notify UI manager if available
        if (window.uiManager && window.uiManager.addChatMessage) {
            window.uiManager.addChatMessage(msg);
        }
    }
    
    saveGame(silent = false) {
        try {
            const saveData = {
                player: this.player,
                inventory: this.inventory,
                gameTime: this.gameTime,
                lastSave: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem('muOnlineSave', JSON.stringify(saveData));
            
            if (!silent) {
                this.showNotification('Game saved!');
                this.addChatMessage('Game saved successfully.', 'system');
            }
            
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            if (!silent) {
                this.addChatMessage('Failed to save game!', 'system');
            }
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem('muOnlineSave');
            if (!saveData) {
                this.addChatMessage('No save game found!', 'system');
                return false;
            }
            
            const data = JSON.parse(saveData);
            
            // Merge saved data
            this.player = data.player || this.player;
            this.inventory = data.inventory || this.inventory;
            this.gameTime = data.gameTime || 0;
            
            this.showNotification('Game loaded!');
            this.addChatMessage('Game loaded successfully.', 'system');
            console.log('Game loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            this.addChatMessage('Corrupted save game! Starting fresh.', 'system');
            return false;
        }
    }
    
    takeDamage(amount) {
        this.player.hp.current = Math.max(0, this.player.hp.current - amount);
        this.addChatMessage(`You took ${amount} damage!`, 'system');
        
        if (this.player.hp.current <= 0) {
            this.playerDeath();
        }
    }
    
    heal(amount) {
        const derived = this.calculateDerivedStats();
        const oldHP = this.player.hp.current;
        this.player.hp.current = Math.min(derived.hpMax, this.player.hp.current + amount);
        const healed = this.player.hp.current - oldHP;
        
        if (healed > 0) {
            this.addChatMessage(`Healed for ${healed} HP!`, 'system');
        }
    }
    
    gainExperience(amount, source = 'monster') {
        this.player.xp.current += amount;
        this.addChatMessage(`+${amount} EXP from ${source}`, 'exp');
        
        if (this.player.xp.current >= this.player.xp.max) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.player.level++;
        this.player.xp.current -= this.player.xp.max;
        this.player.xp.max = Math.floor(this.player.xp.max * 1.5);
        
        // Increase stats
        this.player.stats.strength += 2;
        this.player.stats.agility += 2;
        this.player.stats.vitality += 3;
        this.player.stats.energy += 1;
        
        // Update derived stats
        const derived = this.calculateDerivedStats();
        
        // Restore HP/MP on level up
        this.player.hp.current = derived.hpMax;
        this.player.mp.current = derived.mpMax;
        
        this.showNotification(`Level ${this.player.level}!`);
        this.addChatMessage(`Congratulations! You reached level ${this.player.level}!`, 'level');
    }
    
    playerDeath() {
        const lostExp = Math.floor(this.player.xp.current * 0.1);
        this.player.xp.current -= lostExp;
        
        const derived = this.calculateDerivedStats();
        this.player.hp.current = derived.hpMax;
        this.player.mp.current = derived.mpMax;
        
        // Drop some items
        const dropCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < dropCount && this.inventory.items.length > 0; i++) {
            const index = Math.floor(Math.random() * this.inventory.items.length);
            if (this.inventory.items[index]) {
                const item = this.inventory.items[index];
                this.inventory.items[index] = null;
                this.addChatMessage(`Lost ${item.name} on death!`, 'loot');
            }
        }
        
        this.addChatMessage(`You died! Lost ${lostExp} experience.`, 'system');
    }
    
    spawnMonster(monsterTemplate, x, y) {
        const monster = { 
            ...monsterTemplate, 
            id: Date.now(), 
            x: x || Math.random() * 4000, 
            y: y || Math.random() * 4000, 
            maxHp: monsterTemplate.hp,
            hp: monsterTemplate.hp,
            lastAttack: null 
        };
        this.monsters.push(monster);
        return monster;
    }
    
    showNotification(text) {
        if (window.uiManager && window.uiManager.showNotification) {
            window.uiManager.showNotification(text);
        }
    }
    
    // Inventory management
    addItemToInventory(item) {
        const emptySlot = this.inventory.items.findIndex(slot => !slot);
        if (emptySlot !== -1) {
            this.inventory.items[emptySlot] = item;
            return true;
        }
        return false;
    }
    
    removeItemFromInventoryByIndex(index) {
        if (index >= 0 && index < this.inventory.items.length) {
            const item = this.inventory.items[index];
            this.inventory.items[index] = null;
            return item;
        }
        return null;
    }
    
    // Equipment management
    equipItem(item, slot) {
        const currentEquipped = this.player.equipment[slot];
        this.player.equipment[slot] = item;
        return currentEquipped;
    }
    
    unequipItem(slot) {
        const item = this.player.equipment[slot];
        this.player.equipment[slot] = null;
        return item;
    }
    
    // Combat
    calculatePlayerDamage() {
        const derived = this.calculateDerivedStats();
        const [min, max] = derived.damage.split('-').map(Number);
        const baseDamage = Math.floor(Math.random() * (max - min + 1)) + min;
        const isCritical = Math.random() * 100 < derived.critical;
        return {
            damage: isCritical ? Math.floor(baseDamage * 1.5) : baseDamage,
            isCritical
        };
    }
    
    attackMonster(monster) {
        if (!monster || monster.hp <= 0) return false;
        
        const damageResult = this.calculatePlayerDamage();
        monster.hp -= damageResult.damage;
        
        const message = damageResult.isCritical 
            ? `Critical hit! ${monster.name} for ${damageResult.damage} damage!`
            : `Hit ${monster.name} for ${damageResult.damage} damage!`;
        
        this.addChatMessage(message, 'system');
        
        if (monster.hp <= 0) {
            this.gainExperience(monster.exp, monster.name);
            
            // Check for loot drop
            if (Math.random() * 100 < monster.dropRate) {
                const availableItems = this.db.items.filter(item => 
                    item.level <= this.player.level && 
                    Math.random() * 100 < item.dropRate
                );
                
                if (availableItems.length > 0) {
                    const item = availableItems[Math.floor(Math.random() * availableItems.length)];
                    if (this.addItemToInventory({ ...item })) {
                        this.addChatMessage(`Looted ${item.name}!`, 'loot');
                    }
                }
            }
            
            return true; // Monster died
        }
        
        return false; // Monster still alive
    }
}