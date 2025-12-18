import { DragDropManager } from '../components/DragDrop.js';

export class UIManager {
    constructor(gameState, renderer, panelManager = null) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.panelManager = panelManager;
        this.dragDropManager = new DragDropManager();
        this.selectedMonster = null;
        this.contextMenu = null;
        this.chatMessages = [];
        this.chatFilter = 'all';
        
        console.log('UIManager initializing...');
        this.initializeUI();
        this.setupEventListeners();
        this.updateUI();
        
        console.log('UIManager initialized');
    }

    initializeUI() {
        console.log('Initializing UI...');
        
        // Initialize drag and drop
        this.dragDropManager.initialize();
        
        // Initialize specific UI components
        this.initializeInventory();
        this.initializePaperdoll();
        this.initializeSkillbook();
        this.initializeSkillSlots();
        this.initializeChat();
        
        console.log('UI initialized');
    }

    initializeInventory() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        if (!inventoryGrid) {
            console.warn('Inventory grid not found');
            return;
        }
        
        console.log('Initializing inventory grid...');
        inventoryGrid.innerHTML = '';
        
        for (let i = 0; i < 64; i++) {
            const slot = this.createInventorySlot(i);
            inventoryGrid.appendChild(slot);
        }
        
        console.log('Inventory grid initialized with 64 slots');
    }

    createInventorySlot(index) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.index = index;
        slot.dataset.type = 'inventory';
        slot.draggable = true;
        
        // Drag events
        slot.addEventListener('dragstart', (e) => this.handleDragStart(e, 'inventory', index));
        slot.addEventListener('dragover', (e) => this.handleDragOver(e));
        slot.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        slot.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        slot.addEventListener('drop', (e) => this.handleDrop(e, 'inventory', index));
        slot.addEventListener('dragend', () => this.handleDragEnd());
        
        // Click events
        slot.addEventListener('click', (e) => {
            if (e.button === 0) { // Left click
                this.handleSlotLeftClick(e, 'inventory', index);
            }
        });
        
        // Right click event
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleSlotRightClick(e, 'inventory', index);
            return false;
        });
        
        // Tooltip events
        slot.addEventListener('mouseenter', (e) => this.showItemTooltip(e, 'inventory', index));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        
        // Double click for quick equip
        slot.addEventListener('dblclick', () => {
            this.handleSlotDoubleClick('inventory', index);
        });
        
        return slot;
    }

    initializePaperdoll() {
        const paperdollContainer = document.getElementById('paperdollContainer');
        if (!paperdollContainer) {
            console.warn('Paperdoll container not found');
            return;
        }
        
        console.log('Initializing paperdoll...');
        paperdollContainer.innerHTML = '';
        
        const paperdollSlots = [
            { slot: 'helm', icon: '👑', label: 'Helm', row: 0, col: 1 },
            { slot: 'amulet', icon: '📿', label: 'Amulet', row: 1, col: 0 },
            { slot: 'weapon', icon: '⚔️', label: 'Weapon', row: 1, col: 1 },
            { slot: 'armor', icon: '🛡️', label: 'Armor', row: 1, col: 2 },
            { slot: 'shield', icon: '🛡️', label: 'Shield', row: 2, col: 0 },
            { slot: 'gloves', icon: '🥊', label: 'Gloves', row: 2, col: 1 },
            { slot: 'ring1', icon: '💍', label: 'Ring', row: 2, col: 2 },
            { slot: 'pants', icon: '👖', label: 'Pants', row: 3, col: 0 },
            { slot: 'ring2', icon: '💍', label: 'Ring', row: 3, col: 1 },
            { slot: 'boots', icon: '👢', label: 'Boots', row: 3, col: 2 },
            { slot: 'wings', icon: '🪽', label: 'Wings', row: 0, col: 0 },
            { slot: 'pet', icon: '🐉', label: 'Pet', row: 0, col: 2 }
        ];
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const slotData = paperdollSlots.find(s => s.row === row && s.col === col);
                if (slotData) {
                    const slot = this.createPaperdollSlot(slotData);
                    paperdollContainer.appendChild(slot);
                }
            }
        }
        
        console.log('Paperdoll initialized with 12 slots');
    }

    createPaperdollSlot(slotData) {
        const slot = document.createElement('div');
        slot.className = 'paperdoll-slot';
        slot.dataset.slot = slotData.slot;
        slot.dataset.type = 'paperdoll';
        slot.draggable = true;
        
        const icon = document.createElement('div');
        icon.className = 'slot-icon';
        icon.textContent = slotData.icon;
        
        const label = document.createElement('span');
        label.className = 'slot-label';
        label.textContent = slotData.label;
        
        slot.appendChild(icon);
        slot.appendChild(label);
        
        // Drag events
        slot.addEventListener('dragstart', (e) => this.handleDragStart(e, 'paperdoll', slotData.slot));
        slot.addEventListener('dragover', (e) => this.handleDragOver(e));
        slot.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        slot.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        slot.addEventListener('drop', (e) => this.handleDrop(e, 'paperdoll', slotData.slot));
        slot.addEventListener('dragend', () => this.handleDragEnd());
        
        // Click events
        slot.addEventListener('click', (e) => {
            if (e.button === 0) { // Left click
                this.handleSlotLeftClick(e, 'paperdoll', slotData.slot);
            }
        });
        
        // Right click event
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleSlotRightClick(e, 'paperdoll', slotData.slot);
            return false;
        });
        
        // Tooltip events
        slot.addEventListener('mouseenter', (e) => this.showItemTooltip(e, 'paperdoll', slotData.slot));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        
        // Double click for quick unequip
        slot.addEventListener('dblclick', () => {
            this.handleSlotDoubleClick('paperdoll', slotData.slot);
        });
        
        return slot;
    }

    initializeSkillbook() {
        const skillList = document.getElementById('skillList');
        if (!skillList) {
            console.warn('Skill list not found');
            return;
        }
        
        console.log('Initializing skillbook...');
        skillList.innerHTML = '';
        
        if (!this.gameState.db.skills || this.gameState.db.skills.length === 0) {
            skillList.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">No skills available</div>';
            return;
        }
        
        this.gameState.db.skills.forEach(skill => {
            const skillItem = document.createElement('div');
            skillItem.className = `skill-item ${this.gameState.player.learnedSkills.includes(skill.id) ? 'learned' : ''}`;
            skillItem.dataset.id = skill.id;
            
            const skillInfo = document.createElement('div');
            skillInfo.className = 'skill-info';
            
            const skillName = document.createElement('div');
            skillName.className = 'skill-name';
            skillName.textContent = skill.name;
            
            const skillReq = document.createElement('div');
            skillReq.className = 'skill-req';
            skillReq.textContent = `Lv.${skill.levelReq} | MP: ${skill.manaCost}`;
            
            const skillDesc = document.createElement('div');
            skillDesc.className = 'skill-desc';
            skillDesc.textContent = skill.description;
            
            skillInfo.appendChild(skillName);
            skillInfo.appendChild(skillReq);
            skillInfo.appendChild(skillDesc);
            skillItem.appendChild(skillInfo);
            
            skillItem.addEventListener('click', () => {
                if (this.gameState.player.level >= skill.levelReq && 
                    !this.gameState.player.learnedSkills.includes(skill.id)) {
                    this.gameState.player.learnedSkills.push(skill.id);
                    skillItem.classList.add('learned');
                    this.gameState.addChatMessage(`Learned skill: ${skill.name}`, 'system');
                }
            });
            
            skillItem.addEventListener('mouseenter', (e) => this.showSkillTooltip(e, skill));
            skillItem.addEventListener('mouseleave', () => this.hideTooltip());
            
            skillList.appendChild(skillItem);
        });
        
        console.log(`Skillbook initialized with ${this.gameState.db.skills.length} skills`);
    }

    initializeSkillSlots() {
        const skillSlots = document.getElementById('skillSlots');
        if (!skillSlots) {
            console.warn('Skill slots not found');
            return;
        }
        
        console.log('Initializing skill slots...');
        skillSlots.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'skill-slot';
            slot.dataset.index = i;
            
            const key = document.createElement('div');
            key.className = 'skill-key';
            key.textContent = i + 1;
            
            slot.appendChild(key);
            
            slot.addEventListener('click', () => {
                this.useSkill(i);
            });
            
            skillSlots.appendChild(slot);
        }
        
        console.log('Skill slots initialized with 8 slots');
    }

    initializeChat() {
        console.log('Initializing chat...');
        
        // Load chat messages from game state
        this.chatMessages = this.gameState.chatMessages || [];
        this.updateChatDisplay();
        
        console.log('Chat initialized');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Game controls
        this.setupGameControls();
        
        // Chat
        this.setupChatControls();
        
        // Canvas events
        this.setupCanvasEvents();
        
        // Keyboard events
        this.setupKeyboardEvents();
        
        console.log('Event listeners set up');
    }

    setupGameControls() {
        const saveBtn = document.getElementById('saveGame');
        const loadBtn = document.getElementById('loadGame');
        const newBtn = document.getElementById('newGame');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.gameState.saveGame();
                this.showNotification('Game saved!');
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (this.gameState.loadGame()) {
                    this.updateUI();
                    this.showNotification('Game loaded!');
                }
            });
        }
        
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (confirm('Start new game? All unsaved progress will be lost.')) {
                    localStorage.clear();
                    window.location.reload();
                }
            });
        }
        
        // Auto-fight controls
        const autoFightToggle = document.getElementById('toggleAutoFight');
        if (autoFightToggle) {
            autoFightToggle.addEventListener('change', (e) => {
                this.gameState.autoFight = e.target.checked;
            });
        }
        
        const autoMoveToggle = document.getElementById('toggleAutoMove');
        if (autoMoveToggle) {
            autoMoveToggle.addEventListener('change', (e) => {
                this.gameState.autoMove = e.target.checked;
            });
        }
    }

    setupChatControls() {
        const sendBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');
        
        if (sendBtn && chatInput) {
            sendBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
            
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Chat tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchChatTab(tabId);
            });
        });
        
        // Chat filters
        const filters = ['showSystemMsg', 'showLootMsg', 'showExpMsg', 'showLevelMsg', 'showEquipMsg'];
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.gameState.chatConfig[filterId.replace('show', '').replace('Msg', '').toLowerCase()] = e.target.checked;
                    this.updateChatDisplay();
                });
            }
        });
    }

    setupCanvasEvents() {
        const gameCanvas = document.getElementById('gameCanvas');
        if (!gameCanvas) return;
        
        gameCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        gameCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        gameCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleCanvasMouseMove(e) {
        if (!this.renderer || !this.renderer.canvas) return;
        
        const rect = this.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.renderer.camera.x;
        const y = e.clientY - rect.top + this.renderer.camera.y;
        
        this.renderer.mouse.x = x;
        this.renderer.mouse.y = y;
        
        this.selectNearestMonster(x, y);
    }

    handleCanvasMouseDown(e) {
        if (!this.renderer || !this.renderer.canvas) return;
        
        const rect = this.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.renderer.camera.x;
        const y = e.clientY - rect.top + this.renderer.camera.y;
        
        if (e.button === 0 && this.selectedMonster) { // Left click
            this.attackMonster(this.selectedMonster);
        } else if (e.button === 2) { // Right click
            this.movePlayerTo(x, y);
        }
    }

    selectNearestMonster(x, y) {
        let nearest = null;
        let nearestDist = Infinity;
        
        this.gameState.monsters.forEach(monster => {
            const dist = Math.sqrt(Math.pow(monster.x - x, 2) + Math.pow(monster.y - y, 2));
            if (dist < 50 && dist < nearestDist && monster.hp > 0) {
                nearestDist = dist;
                nearest = monster;
            }
        });
        
        this.selectedMonster = nearest;
    }

    attackMonster(monster) {
        if (!monster || monster.hp <= 0) return;
        
        const result = this.gameState.attackMonster(monster);
        if (result) { // Monster died
            if (this.selectedMonster === monster) {
                this.selectedMonster = null;
            }
        }
        
        this.updateUI();
    }

    movePlayerTo(x, y) {
        this.gameState.player.position.x = x;
        this.gameState.player.position.y = y;
    }

    handleKeyDown(e) {
        // Skill keys 1-8
        if (e.key >= '1' && e.key <= '8') {
            const index = parseInt(e.key) - 1;
            this.useSkill(index);
            e.preventDefault();
        }
        
        // Movement keys
        const speed = 5;
        switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
                this.gameState.player.position.y -= speed;
                break;
            case 'arrowleft':
            case 'a':
                this.gameState.player.position.x -= speed;
                break;
            case 'arrowdown':
            case 's':
                this.gameState.player.position.y += speed;
                break;
            case 'arrowright':
            case 'd':
                this.gameState.player.position.x += speed;
                break;
            case ' ':
                // Attack nearest monster
                if (this.selectedMonster) {
                    this.attackMonster(this.selectedMonster);
                }
                break;
        }
    }

    useSkill(skillIndex) {
        const skillId = this.gameState.player.learnedSkills[skillIndex];
        if (!skillId) {
            this.gameState.addChatMessage('No skill in this slot!', 'system');
            return;
        }
        
        const skill = this.gameState.db.getSkillById(skillId);
        if (!skill) {
            this.gameState.addChatMessage('Skill not found!', 'system');
            return;
        }
        
        if (this.gameState.player.level < skill.levelReq) {
            this.gameState.addChatMessage(`Skill requires level ${skill.levelReq}!`, 'system');
            return;
        }
        
        if (this.gameState.player.mp.current < skill.manaCost) {
            this.gameState.addChatMessage('Not enough MP!', 'system');
            return;
        }
        
        this.gameState.player.mp.current -= skill.manaCost;
        
        if (skill.type === 'attack') {
            const target = this.selectedMonster || this.gameState.player.autoTarget;
            if (target) {
                target.hp -= skill.damage;
                this.gameState.addChatMessage(`${skill.name} hit for ${skill.damage} damage!`, 'system');
                
                if (target.hp <= 0) {
                    const index = this.gameState.monsters.indexOf(target);
                    if (index !== -1) {
                        this.gameState.monsters.splice(index, 1);
                        this.gameState.gainExperience(target.exp, target.name);
                    }
                }
            }
        } else if (skill.type === 'heal') {
            this.gameState.heal(skill.heal);
        }
        
        this.updateUI();
    }

    // Drag and Drop Handlers
    handleDragStart(e, type, index) {
        const item = this.getItemFromSlot(type, index);
        if (!item) {
            e.preventDefault();
            return;
        }
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: type,
            index: index,
            item: item
        }));
        
        e.dataTransfer.effectAllowed = 'move';
        
        // Create drag ghost
        this.dragDropManager.createDragGhost(item, e.clientX, e.clientY);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('inventory-slot') || 
            e.target.classList.contains('paperdoll-slot')) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('inventory-slot') || 
            e.target.classList.contains('paperdoll-slot')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e, targetType, targetIndex) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.target.classList.contains('inventory-slot') || 
            e.target.classList.contains('paperdoll-slot')) {
            e.target.classList.remove('drag-over');
        }
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const sourceType = data.type;
            const sourceIndex = data.index;
            const sourceItem = data.item;
            
            if (sourceType === targetType && sourceIndex === targetIndex) return;
            
            this.handleItemTransfer(sourceType, sourceIndex, targetType, targetIndex, sourceItem);
            
        } catch (error) {
            console.log('Drop failed:', error);
        }
    }

    handleDragEnd() {
        this.dragDropManager.cleanupDrag();
    }

    handleItemTransfer(sourceType, sourceIndex, targetType, targetIndex, item) {
        if (targetType === 'paperdoll') {
            // Check if item can be equipped in this slot
            if (!this.canEquipInSlot(item, targetIndex)) {
                this.gameState.addChatMessage(`Cannot equip ${item.type} in ${targetIndex} slot!`, 'system');
                return;
            }
            
            const currentEquipped = this.gameState.player.equipment[targetIndex];
            
            // Equip the item
            this.gameState.player.equipment[targetIndex] = item;
            
            if (this.gameState.chatConfig.equip) {
                this.gameState.addChatMessage(`Equipped ${item.name}!`, 'system');
            }
            
            // Handle source
            if (sourceType === 'inventory') {
                this.gameState.inventory.items[sourceIndex] = currentEquipped;
            } else if (sourceType === 'paperdoll') {
                this.gameState.player.equipment[sourceIndex] = currentEquipped;
            }
            
        } else if (targetType === 'inventory') {
            const targetInvIndex = parseInt(targetIndex);
            const targetItem = this.gameState.inventory.items[targetInvIndex];
            
            if (sourceType === 'inventory') {
                const sourceInvIndex = parseInt(sourceIndex);
                this.gameState.inventory.items[targetInvIndex] = item;
                this.gameState.inventory.items[sourceInvIndex] = targetItem;
            } else if (sourceType === 'paperdoll') {
                this.gameState.inventory.items[targetInvIndex] = item;
                this.gameState.player.equipment[sourceIndex] = targetItem;
                
                if (this.gameState.chatConfig.equip) {
                    this.gameState.addChatMessage(`Unequipped ${item.name}!`, 'system');
                }
            }
        }
        
        this.updateUI();
    }

    canEquipInSlot(item, slot) {
        const slotMap = {
            'weapon': ['weapon'],
            'armor': ['armor'],
            'helm': ['helm'],
            'gloves': ['gloves'],
            'pants': ['pants'],
            'boots': ['boots'],
            'ring1': ['ring'],
            'ring2': ['ring'],
            'amulet': ['amulet'],
            'wings': ['wings'],
            'pet': ['pet'],
            'shield': ['shield']
        };
        
        return slotMap[slot]?.includes(item.type) || false;
    }

    // Click Handlers
    handleSlotLeftClick(e, type, index) {
        const item = this.getItemFromSlot(type, index);
        if (!item) return;
        
        if (item.type === 'potion') {
            this.useItem(item, type, index);
        }
    }

    handleSlotRightClick(e, type, index) {
        const item = this.getItemFromSlot(type, index);
        if (!item) return;
        
        const options = [];
        
        if (type === 'inventory') {
            // Check if item is equippable
            const equippableTypes = ['weapon', 'armor', 'helm', 'gloves', 'pants', 'boots', 'ring', 'amulet', 'wings', 'pet', 'shield'];
            
            if (equippableTypes.includes(item.type)) {
                options.push({
                    label: 'Equip',
                    action: () => this.equipItemFromInventory(index, item)
                });
            }
            
            if (item.type === 'potion') {
                options.push({
                    label: 'Use',
                    action: () => this.useItem(item, type, index)
                });
            }
            
            options.push({
                label: 'Drop',
                action: () => this.dropItem(index, item)
            });
            
        } else if (type === 'paperdoll') {
            options.push({
                label: 'Unequip',
                action: () => this.unequipItemToInventory(index, item)
            });
        }
        
        if (options.length > 0) {
            this.dragDropManager.showContextMenu(e.clientX, e.clientY, options);
        }
    }

    handleSlotDoubleClick(type, index) {
        const item = this.getItemFromSlot(type, index);
        if (!item) return;
        
        if (type === 'inventory') {
            // Auto-equip if possible
            const equippableTypes = ['weapon', 'armor', 'helm', 'gloves', 'pants', 'boots', 'ring', 'amulet', 'wings', 'pet', 'shield'];
            if (equippableTypes.includes(item.type)) {
                this.equipItemFromInventory(index, item);
            } else if (item.type === 'potion') {
                this.useItem(item, type, index);
            }
        } else if (type === 'paperdoll') {
            this.unequipItemToInventory(index, item);
        }
    }

    equipItemFromInventory(invIndex, item) {
        // Find appropriate paperdoll slot
        const slot = this.findEquipSlotForItem(item);
        if (!slot) {
            this.gameState.addChatMessage(`No available slot for ${item.type}!`, 'system');
            return;
        }
        
        const currentEquipped = this.gameState.player.equipment[slot];
        
        // Equip the item
        this.gameState.player.equipment[slot] = item;
        this.gameState.inventory.items[invIndex] = currentEquipped;
        
        this.gameState.addChatMessage(`Equipped ${item.name}!`, 'system');
        this.updateUI();
    }

    findEquipSlotForItem(item) {
        const slotMap = {
            'weapon': 'weapon',
            'armor': 'armor',
            'helm': 'helm',
            'gloves': 'gloves',
            'pants': 'pants',
            'boots': 'boots',
            'ring': this.gameState.player.equipment.ring1 ? 'ring2' : 'ring1',
            'amulet': 'amulet',
            'wings': 'wings',
            'pet': 'pet',
            'shield': 'shield'
        };
        
        return slotMap[item.type];
    }

    unequipItemToInventory(paperdollSlot, item) {
        // Find empty inventory slot
        const emptyIndex = this.gameState.inventory.items.findIndex(slot => !slot);
        if (emptyIndex === -1) {
            this.gameState.addChatMessage('Inventory is full!', 'system');
            return;
        }
        
        // Unequip item
        this.gameState.player.equipment[paperdollSlot] = null;
        this.gameState.inventory.items[emptyIndex] = item;
        
        this.gameState.addChatMessage(`Unequipped ${item.name}!`, 'system');
        this.updateUI();
    }

    useItem(item, type, index) {
        switch(item.type) {
            case 'potion':
                if (item.stats?.heal) {
                    this.gameState.heal(item.stats.heal);
                }
                if (item.stats?.mana) {
                    this.gameState.player.mp.current = Math.min(
                        this.gameState.player.mp.max,
                        this.gameState.player.mp.current + item.stats.mana
                    );
                }
                
                if (item.stackable) {
                    item.count = (item.count || 1) - 1;
                    if (item.count <= 0) {
                        if (type === 'inventory') {
                            this.gameState.inventory.items[index] = null;
                        } else {
                            this.gameState.player.equipment[index] = null;
                        }
                    }
                }
                break;
                
            case 'scroll':
                this.gameState.addChatMessage(`Used ${item.name}!`, 'system');
                if (type === 'inventory') {
                    this.gameState.inventory.items[index] = null;
                }
                break;
        }
        
        this.updateUI();
    }

    dropItem(index, item) {
        if (confirm(`Drop ${item.name}?`)) {
            this.gameState.inventory.items[index] = null;
            this.gameState.addChatMessage(`Dropped ${item.name}!`, 'system');
            this.updateUI();
        }
    }

    getItemFromSlot(type, index) {
        if (type === 'inventory') {
            return this.gameState.inventory.items[index];
        } else if (type === 'paperdoll') {
            return this.gameState.player.equipment[index];
        }
        return null;
    }

    // Tooltip Methods
    showItemTooltip(e, type, index) {
        const item = this.getItemFromSlot(type, index);
        if (!item) return;
        
        const tooltip = document.getElementById('itemTooltip');
        if (!tooltip) return;
        
        let html = `<div class="tooltip-header">${item.name}</div>`;
        
        const rarityColors = {
            common: '#ffffff',
            uncommon: '#448aff',
            rare: '#ffd740',
            epic: '#e94560',
            legendary: '#ff9800'
        };
        
        html += `<div style="color: ${rarityColors[item.rarity]}; margin-bottom: 10px;">
            Lv.${item.level} ${item.rarity.toUpperCase()}
        </div>`;
        
        html += '<div class="tooltip-stats">';
        for (const [stat, value] of Object.entries(item.stats || {})) {
            html += `<div class="tooltip-stat">
                <span class="stat-name">${stat}:</span>
                <span class="stat-value">${value}</span>
            </div>`;
        }
        html += `<div class="tooltip-stat">
            <span class="stat-name">Drop Rate:</span>
            <span class="stat-value">${item.dropRate}%</span>
        </div>`;
        html += '</div>';
        
        if (item.description) {
            html += `<div class="tooltip-description">${item.description}</div>`;
        }
        
        tooltip.innerHTML = html;
        tooltip.style.display = 'block';
        
        let left = e.clientX + 15;
        let top = e.clientY + 15;
        
        if (left + tooltip.offsetWidth > window.innerWidth) {
            left = e.clientX - tooltip.offsetWidth - 15;
        }
        if (top + tooltip.offsetHeight > window.innerHeight) {
            top = e.clientY - tooltip.offsetHeight - 15;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    showSkillTooltip(e, skill) {
        const tooltip = document.getElementById('itemTooltip');
        if (!tooltip) return;
        
        const html = `
            <div class="tooltip-header">${skill.name}</div>
            <div class="tooltip-stats">
                <div class="tooltip-stat">
                    <span class="stat-name">Type:</span>
                    <span class="stat-value">${skill.type}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-name">Level Req:</span>
                    <span class="stat-value">${skill.levelReq}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-name">Mana Cost:</span>
                    <span class="stat-value">${skill.manaCost}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-name">${skill.type === 'heal' ? 'Heal' : 'Damage'}:</span>
                    <span class="stat-value">${skill.damage || skill.heal || 0}</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-name">Cooldown:</span>
                    <span class="stat-value">${skill.cooldown}s</span>
                </div>
                <div class="tooltip-stat">
                    <span class="stat-name">Range:</span>
                    <span class="stat-value">${skill.range}</span>
                </div>
            </div>
            <div class="tooltip-description">${skill.description}</div>
        `;
        
        tooltip.innerHTML = html;
        tooltip.style.display = 'block';
        
        let left = e.clientX + 15;
        let top = e.clientY + 15;
        
        if (left + tooltip.offsetWidth > window.innerWidth) {
            left = e.clientX - tooltip.offsetWidth - 15;
        }
        if (top + tooltip.offsetHeight > window.innerHeight) {
            top = e.clientY - tooltip.offsetHeight - 15;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('itemTooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // Chat Methods
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input?.value.trim();
        if (message) {
            this.gameState.addChatMessage(message, 'system');
            input.value = '';
        }
    }

    switchChatTab(tabId) {
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        this.chatFilter = tabId;
        this.updateChatDisplay();
    }

    addChatMessage(msg) {
        this.chatMessages.push(msg);
        this.updateChatDisplay();
    }

    updateChatDisplay() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        this.chatMessages.forEach(msg => {
            if (this.chatFilter === 'all' || this.chatFilter === msg.type) {
                if (this.gameState.chatConfig[msg.type]) {
                    const messageElement = document.createElement('div');
                    messageElement.className = `chat-message ${msg.type}`;
                    messageElement.textContent = `[${msg.displayTime || new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}] ${msg.text}`;
                    chatMessages.appendChild(messageElement);
                }
            }
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // UI Update Methods
    updateUI() {
        this.updateCharacterPanel();
        this.updateVitals();
        this.updateInventory();
        this.updatePaperdoll();
        this.updateSkillSlots();
        this.updateEventTimer();
    }

    updateCharacterPanel() {
        const statsContent = document.getElementById('characterStatsContent');
        if (!statsContent) {
            console.warn('Character stats content element not found');
            return;
        }
        
        const player = this.gameState.player;
        const derived = this.gameState.calculateDerivedStats();
        
        statsContent.innerHTML = `
            <div class="stat-item"><span>Level:</span><span class="stat-value">${player.level}</span></div>
            <div class="stat-item"><span>Class:</span><span class="stat-value">${player.class}</span></div>
            <div class="stat-item"><span>Strength:</span><span class="stat-value">${player.stats.strength}</span></div>
            <div class="stat-item"><span>Agility:</span><span class="stat-value">${player.stats.agility}</span></div>
            <div class="stat-item"><span>Vitality:</span><span class="stat-value">${player.stats.vitality}</span></div>
            <div class="stat-item"><span>Energy:</span><span class="stat-value">${player.stats.energy}</span></div>
            <div class="stat-item"><span>Damage:</span><span class="stat-value">${derived.damage}</span></div>
            <div class="stat-item"><span>Defense:</span><span class="stat-value">${derived.defense}</span></div>
            <div class="stat-item"><span>Accuracy:</span><span class="stat-value">${derived.accuracy}%</span></div>
            <div class="stat-item"><span>Critical:</span><span class="stat-value">${derived.critical}%</span></div>
            <div class="stat-item"><span>Attack Speed:</span><span class="stat-value">${derived.attackSpeed}</span></div>
            <div class="stat-item"><span>Move Speed:</span><span class="stat-value">${derived.moveSpeed}%</span></div>
        `;
        
        console.log('Character panel updated');
    }

    updateVitals() {
        const player = this.gameState.player;
        const derived = this.gameState.calculateDerivedStats();
        
        // Update bars
        const hpPercent = (player.hp.current / derived.hpMax) * 100;
        const mpPercent = (player.mp.current / derived.mpMax) * 100;
        const xpPercent = (player.xp.current / player.xp.max) * 100;
        
        const hpBar = document.getElementById('hpBar');
        const mpBar = document.getElementById('mpBar');
        const xpBar = document.getElementById('xpBar');
        
        if (hpBar) hpBar.style.width = `${hpPercent}%`;
        if (mpBar) mpBar.style.width = `${mpPercent}%`;
        if (xpBar) xpBar.style.width = `${xpPercent}%`;
        
        // Update text
        const hpText = document.getElementById('hpText');
        const mpText = document.getElementById('mpText');
        const xpText = document.getElementById('xpText');
        
        if (hpText) hpText.textContent = `${Math.round(player.hp.current)}/${derived.hpMax}`;
        if (mpText) mpText.textContent = `${Math.round(player.mp.current)}/${derived.mpMax}`;
        if (xpText) xpText.textContent = `${player.xp.current}/${player.xp.max}`;
    }

    updateInventory() {
        const inventorySlots = document.querySelectorAll('.inventory-slot');
        inventorySlots.forEach((slot, index) => {
            const item = this.gameState.inventory.items[index];
            this.updateSlot(slot, item);
        });
    }

    updatePaperdoll() {
        document.querySelectorAll('.paperdoll-slot').forEach(slot => {
            const slotName = slot.dataset.slot;
            const item = this.gameState.player.equipment[slotName];
            
            if (item) {
                slot.classList.add('occupied');
                const icon = slot.querySelector('.slot-icon');
                if (icon) {
                    icon.innerHTML = '';
                    const itemIcon = document.createElement('div');
                    itemIcon.className = 'item-icon';
                    itemIcon.style.background = this.dragDropManager.getItemColor(item.rarity);
                    itemIcon.style.width = '70%';
                    itemIcon.style.height = '70%';
                    icon.appendChild(itemIcon);
                }
                
                const label = slot.querySelector('.slot-label');
                if (label) {
                    label.textContent = item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name;
                }
            } else {
                slot.classList.remove('occupied');
                const icon = slot.querySelector('.slot-icon');
                const label = slot.querySelector('.slot-label');
                
                if (icon) {
                    icon.innerHTML = slot.dataset.slot === 'weapon' ? '⚔️' :
                                   slot.dataset.slot === 'armor' ? '🛡️' :
                                   slot.dataset.slot === 'helm' ? '👑' :
                                   slot.dataset.slot === 'gloves' ? '🥊' :
                                   slot.dataset.slot === 'pants' ? '👖' :
                                   slot.dataset.slot === 'boots' ? '👢' :
                                   slot.dataset.slot === 'ring1' || slot.dataset.slot === 'ring2' ? '💍' :
                                   slot.dataset.slot === 'amulet' ? '📿' :
                                   slot.dataset.slot === 'wings' ? '🪽' :
                                   slot.dataset.slot === 'pet' ? '🐉' :
                                   slot.dataset.slot === 'shield' ? '🛡️' : '❓';
                }
                
                if (label) {
                    label.textContent = slot.dataset.slot.charAt(0).toUpperCase() + slot.dataset.slot.slice(1);
                }
            }
        });
    }

    updateSlot(slot, item) {
        slot.className = 'inventory-slot';
        slot.innerHTML = '';
        
        if (item) {
            slot.classList.add('item');
            
            const icon = document.createElement('div');
            icon.className = 'item-icon';
            icon.style.background = this.dragDropManager.getItemColor(item.rarity);
            slot.appendChild(icon);
            
            if (item.stackable && (item.count || 1) > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = item.count || 1;
                slot.appendChild(count);
            }
            
            if (item.level > 1) {
                const level = document.createElement('div');
                level.className = 'item-level';
                level.textContent = `Lv.${item.level}`;
                slot.appendChild(level);
            }
        }
    }

    updateSkillSlots() {
        const skillSlots = document.querySelectorAll('.skill-slot');
        skillSlots.forEach((slot, index) => {
            const skillId = this.gameState.player.learnedSkills[index];
            const skill = this.gameState.db.getSkillById(skillId);
            
            slot.innerHTML = '';
            if (skill) {
                const icon = document.createElement('div');
                icon.className = 'skill-icon';
                icon.style.background = this.dragDropManager.getItemColor('rare');
                
                const name = document.createElement('div');
                name.textContent = skill.name.substring(0, 4);
                name.style.fontSize = '10px';
                name.style.color = '#ffd740';
                name.style.marginTop = '5px';
                
                slot.appendChild(icon);
                slot.appendChild(name);
            }
            
            const key = document.createElement('div');
            key.className = 'skill-key';
            key.textContent = index + 1;
            slot.appendChild(key);
        });
    }

    updateEventTimer() {
        const goldenInvasion = this.gameState.db.events?.find(e => e.name === 'Golden Invasion');
        if (goldenInvasion && !goldenInvasion.active) {
            const timeLeft = Math.max(0, (goldenInvasion.nextSpawn || Date.now() + 300000) - Date.now());
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            const countdown = document.getElementById('eventCountdown');
            const timer = document.getElementById('eventTimer');
            
            if (countdown && timer) {
                if (timeLeft <= 60000) {
                    countdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    timer.style.display = 'block';
                } else {
                    timer.style.display = 'none';
                }
            }
        } else {
            const timer = document.getElementById('eventTimer');
            if (timer) timer.style.display = 'none';
        }
    }

    showNotification(text) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        if (notification && notificationText) {
            notificationText.textContent = text;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }

    getItemColor(rarity) {
        return this.dragDropManager.getItemColor(rarity);
    }
}