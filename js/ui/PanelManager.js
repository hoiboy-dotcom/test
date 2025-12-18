export class PanelManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.panels = {};
        this.panelElements = {};
        this.panelMenuItems = [];
        
        this.panelDefinitions = [
            {
                id: 'character',
                title: '⚔️ Character Stats',
                icon: '⚔️',
                defaultPosition: { top: '100px', left: '20px', width: '320px', height: '400px' },
                defaultVisible: true
            },
            {
                id: 'vital',
                title: '❤️ Vitals',
                icon: '❤️',
                defaultPosition: { top: '100px', right: '350px', width: '250px', height: '180px' },
                defaultVisible: true,
                className: 'vital-panel'
            },
            {
                id: 'inventory',
                title: '🎒 Inventory',
                icon: '🎒',
                defaultPosition: { top: '100px', right: '20px', width: '420px', height: '600px' },
                defaultVisible: true
            },
            {
                id: 'skillbook',
                title: '📚 Skillbook',
                icon: '📚',
                defaultPosition: { top: '150px', left: '400px', width: '500px', height: '500px' },
                defaultVisible: true,
                className: 'skillbook-panel'
            },
            {
                id: 'chat',
                title: '💬 Chat',
                icon: '💬',
                defaultPosition: { bottom: '20px', left: '20px', width: '400px', height: '300px' },
                defaultVisible: true
            },
            {
                id: 'minimap',
                title: '🗺️ Minimap',
                icon: '🗺️',
                defaultPosition: { top: '20px', right: '20px', width: '200px', height: '200px' },
                defaultVisible: true,
                className: 'minimap-panel'
            },
            {
                id: 'autoFight',
                title: '🤖 Auto-Fight',
                icon: '🤖',
                defaultPosition: { bottom: '120px', left: '20px', width: '400px', height: '300px' },
                defaultVisible: true,
                className: 'auto-fight-panel'
            },
            {
                id: 'skill',
                title: '✨ Skill Bar',
                icon: '✨',
                defaultPosition: { bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '80px' },
                defaultVisible: true
            }
        ];
    }

    initialize(gameWorld) {
        this.gameWorld = gameWorld;
        this.createAllPanels();
        this.initializePanels();
        this.setupPanelControls();
        this.loadPanelPositions();
        this.createPanelMenu();
        console.log('PanelManager initialized');
    }

    createAllPanels() {
        this.panelDefinitions.forEach(panelDef => {
            this.createPanel(panelDef);
        });
    }

    createPanel(panelDef) {
        const panel = document.createElement('div');
        panel.id = `${panelDef.id}Panel`;
        panel.className = `ui-panel ${panelDef.className || ''}`;
        panel.dataset.panelId = panelDef.id;
        
        // Set default position
        Object.keys(panelDef.defaultPosition).forEach(key => {
            panel.style[key] = panelDef.defaultPosition[key];
        });
        
        // Create panel content based on type
        const content = this.getPanelContent(panelDef);
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3>${panelDef.title}</h3>
                <div class="panel-controls">
                    <button class="panel-btn lock-btn" data-panel="${panelDef.id}">🔒</button>
                    <button class="panel-btn close-btn" data-panel="${panelDef.id}">✕</button>
                </div>
            </div>
            <div class="panel-content">
                ${content}
            </div>
            <div class="resize-handle"></div>
        `;
        
        this.gameWorld.appendChild(panel);
        this.panelElements[panelDef.id] = panel;
        
        // Initialize panel state
        this.panels[panelDef.id] = {
            element: panel,
            locked: false,
            visible: panelDef.defaultVisible,
            definition: panelDef
        };
        
        // Make draggable
        this.makeDraggable(panel, panelDef.id);
        
        return panel;
    }

    getPanelContent(panelDef) {
        switch(panelDef.id) {
            case 'character':
                return '<div class="character-stats" id="characterStatsContent"></div>';
            case 'vital':
                return `
                    <div class="vital-bars">
                        <div class="bar-container">
                            <span class="bar-label hp-label">HP</span>
                            <div class="bar-background">
                                <div class="bar-fill hp-fill" id="hpBar" style="width:100%"></div>
                                <div class="bar-text" id="hpText">50/50</div>
                            </div>
                        </div>
                        <div class="bar-container">
                            <span class="bar-label mp-label">MP</span>
                            <div class="bar-background">
                                <div class="bar-fill mp-fill" id="mpBar" style="width:100%"></div>
                                <div class="bar-text" id="mpText">20/20</div>
                            </div>
                        </div>
                        <div class="bar-container">
                            <span class="bar-label xp-label">XP</span>
                            <div class="bar-background">
                                <div class="bar-fill xp-fill" id="xpBar" style="width:0%"></div>
                                <div class="bar-text" id="xpText">0/100</div>
                            </div>
                        </div>
                    </div>
                `;
            case 'inventory':
                return `
                    <div class="inventory-grid" id="inventoryGrid"></div>
                    <div class="paperdoll-container" id="paperdollContainer"></div>
                `;
            case 'skillbook':
                return '<div class="skill-list" id="skillList"></div>';
            case 'chat':
                return `
                    <div class="chat-tabs">
                        <div class="chat-tab active" data-tab="all">All</div>
                        <div class="chat-tab" data-tab="system">System</div>
                        <div class="chat-tab" data-tab="loot">Loot</div>
                        <div class="chat-tab" data-tab="exp">EXP</div>
                    </div>
                    <div class="chat-messages" id="chatMessages"></div>
                    <div class="chat-config">
                        <div class="config-checkbox"><input type="checkbox" id="showSystemMsg" checked><label>System</label></div>
                        <div class="config-checkbox"><input type="checkbox" id="showLootMsg" checked><label>Loot</label></div>
                        <div class="config-checkbox"><input type="checkbox" id="showExpMsg" checked><label>EXP</label></div>
                        <div class="config-checkbox"><input type="checkbox" id="showLevelMsg" checked><label>Level Up</label></div>
                        <div class="config-checkbox"><input type="checkbox" id="showEquipMsg" checked><label>Equip/Unequip</label></div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="chatInput" placeholder="Type message...">
                        <button class="btn" id="sendChatBtn">Send</button>
                    </div>
                `;
            case 'minimap':
                return '<canvas id="minimapCanvas"></canvas>';
            case 'autoFight':
                return `
                    <div class="auto-fight-settings">
                        <div class="setting-item">
                            <span>Enable Auto-Fight</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggleAutoFight" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <span>Auto-Move</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggleAutoMove" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <span>Use HP Potion:</span>
                            <div class="number-input">
                                <input type="number" id="hpThreshold" min="10" max="90" value="30" class="form-control">
                                <span>%</span>
                            </div>
                        </div>
                        <div class="setting-item">
                            <span>Use MP Potion:</span>
                            <div class="number-input">
                                <input type="number" id="mpThreshold" min="10" max="90" value="20" class="form-control">
                                <span>%</span>
                            </div>
                        </div>
                        <div class="auto-move-settings">
                            <div class="setting-item">
                                <span>Search Radius:</span>
                                <div class="number-input">
                                    <input type="number" id="searchRadius" min="100" max="1000" value="500" class="form-control">
                                    <span>px</span>
                                </div>
                            </div>
                            <div class="setting-item">
                                <span>Target Priority:</span>
                                <select id="targetPriority" class="form-control">
                                    <option value="nearest">Nearest</option>
                                    <option value="lowest_hp">Lowest HP</option>
                                    <option value="highest_xp">Highest XP</option>
                                    <option value="weakest">Weakest</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
            case 'skill':
                return '<div class="skill-slots" id="skillSlots"></div>';
            default:
                return '';
        }
    }

    makeDraggable(panel, panelId) {
        if (!panel) return;
        
        const header = panel.querySelector('.panel-header');
        if (!header) return;
        
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        let isResizing = false;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('lock-btn') || 
                e.target.classList.contains('close-btn') || 
                e.target.classList.contains('panel-btn') || 
                e.target.classList.contains('resize-handle')) {
                return;
            }
            
            if (this.panels[panelId].locked) return;
            
            isDragging = true;
            offset.x = e.clientX - panel.offsetLeft;
            offset.y = e.clientY - panel.offsetTop;
            
            // Bring to front
            panel.style.zIndex = '1000';
            document.querySelectorAll('.ui-panel').forEach(p => {
                if (p !== panel) p.style.zIndex = '100';
            });
            
            e.preventDefault();
        });
        
        // Resize handle
        const resizeHandle = panel.querySelector('.resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isResizing = true;
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = panel.offsetWidth;
                const startHeight = panel.offsetHeight;
                
                const onMouseMove = (e) => {
                    if (!isResizing) return;
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    panel.style.width = `${Math.max(200, startWidth + dx)}px`;
                    panel.style.height = `${Math.max(150, startHeight + dy)}px`;
                    this.updatePanelContent(panel);
                };
                
                const onMouseUp = () => {
                    isResizing = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    this.savePanelPositions();
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && panel) {
                let newX = e.clientX - offset.x;
                let newY = e.clientY - offset.y;
                
                // Keep panel within window bounds
                const rect = panel.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(50, Math.min(newY, maxY - 10));
                
                panel.style.left = `${newX}px`;
                panel.style.top = `${newY}px`;
                
                // Clear any absolute positioning that might conflict
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                panel.style.transform = 'none';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.savePanelPositions();
            }
        });
    }

    updatePanelContent(panel) {
        const content = panel.querySelector('.panel-content');
        if (content) {
            const fontSize = Math.max(10, Math.min(14, panel.offsetWidth / 30));
            content.style.fontSize = `${fontSize}px`;
        }
    }

    initializePanels() {
        Object.keys(this.panels).forEach(panelId => {
            const panel = this.panels[panelId];
            if (panel.visible) {
                this.showPanel(panelId);
            } else {
                this.hidePanel(panelId);
            }
        });
    }

    setupPanelControls() {
        // Lock buttons
        document.querySelectorAll('.lock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const panelId = btn.dataset.panel;
                this.togglePanelLock(panelId);
            });
        });
        
        // Close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const panelId = btn.dataset.panel;
                this.hidePanel(panelId);
            });
        });
    }

    createPanelMenu() {
        const panelMenu = document.getElementById('panelMenu');
        if (!panelMenu) return;
        
        panelMenu.innerHTML = '';
        
        this.panelDefinitions.forEach(panelDef => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.dataset.panel = panelDef.id;
            menuItem.innerHTML = `
                <span>${panelDef.icon} ${panelDef.title}</span>
                <div class="menu-toggle ${this.panels[panelDef.id]?.visible ? 'active' : ''}"></div>
            `;
            
            menuItem.addEventListener('click', () => {
                this.togglePanelVisibility(panelDef.id);
            });
            
            panelMenu.appendChild(menuItem);
            this.panelMenuItems.push(menuItem);
        });
        
        // Add toggle all button
        const toggleAllItem = document.createElement('div');
        toggleAllItem.className = 'menu-item';
        toggleAllItem.id = 'toggleAllPanels';
        toggleAllItem.innerHTML = `
            <span>Toggle All</span>
            <div class="menu-toggle"></div>
        `;
        
        toggleAllItem.addEventListener('click', () => {
            this.toggleAllPanels();
        });
        
        panelMenu.appendChild(toggleAllItem);
    }

    updatePanelMenu() {
        this.panelMenuItems.forEach(menuItem => {
            const panelId = menuItem.dataset.panel;
            const toggle = menuItem.querySelector('.menu-toggle');
            if (toggle && this.panels[panelId]) {
                toggle.classList.toggle('active', this.panels[panelId].visible);
            }
        });
        
        const toggleAllBtn = document.getElementById('toggleAllPanels');
        if (toggleAllBtn) {
            const allVisible = Object.values(this.panels).every(p => p.visible);
            const toggle = toggleAllBtn.querySelector('.menu-toggle');
            if (toggle) toggle.classList.toggle('active', allVisible);
        }
    }

    togglePanelVisibility(panelId) {
        if (!this.panels[panelId]) return;
        
        if (this.panels[panelId].visible) {
            this.hidePanel(panelId);
        } else {
            this.showPanel(panelId);
        }
    }

    showPanel(panelId) {
        const panel = this.panels[panelId];
        if (!panel || !panel.element) return;
        
        panel.element.classList.remove('hidden');
        panel.visible = true;
        localStorage.setItem(`panel_${panelId}_hidden`, 'false');
        this.updatePanelMenu();
        this.savePanelPositions();
    }

    hidePanel(panelId) {
        const panel = this.panels[panelId];
        if (!panel || !panel.element) return;
        
        panel.element.classList.add('hidden');
        panel.visible = false;
        localStorage.setItem(`panel_${panelId}_hidden`, 'true');
        this.updatePanelMenu();
        this.savePanelPositions();
    }

    toggleAllPanels() {
        const allVisible = Object.values(this.panels).every(p => p.visible);
        
        Object.keys(this.panels).forEach(panelId => {
            if (allVisible) {
                this.hidePanel(panelId);
            } else {
                this.showPanel(panelId);
            }
        });
    }

    togglePanelLock(panelId) {
        const panel = this.panels[panelId];
        if (!panel || !panel.element) return;
        
        panel.locked = !panel.locked;
        panel.element.classList.toggle('locked', panel.locked);
        this.savePanelPositions();
    }

    savePanelPositions() {
        const positions = {};
        Object.keys(this.panels).forEach(panelId => {
            const panel = this.panels[panelId];
            if (panel && panel.element) {
                const rect = panel.element.getBoundingClientRect();
                positions[panelId] = {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    locked: panel.locked,
                    visible: panel.visible
                };
            }
        });
        localStorage.setItem('muOnlineUIPositions', JSON.stringify(positions));
    }

    loadPanelPositions() {
        const saved = localStorage.getItem('muOnlineUIPositions');
        if (saved) {
            try {
                const positions = JSON.parse(saved);
                Object.keys(positions).forEach(panelId => {
                    const panel = this.panels[panelId];
                    const pos = positions[panelId];
                    
                    if (panel && panel.element && pos) {
                        panel.element.style.left = `${pos.x}px`;
                        panel.element.style.top = `${pos.y}px`;
                        panel.element.style.width = `${pos.width}px`;
                        panel.element.style.height = `${pos.height}px`;
                        
                        if (pos.locked) {
                            panel.element.classList.add('locked');
                            panel.locked = true;
                        }
                        
                        panel.element.classList.toggle('hidden', !pos.visible);
                        panel.visible = pos.visible;
                        
                        this.updatePanelContent(panel.element);
                    }
                });
            } catch (e) {
                console.error('Error loading panel positions:', e);
            }
        }
    }

    getPanel(panelId) {
        return this.panels[panelId];
    }

    getPanelElement(panelId) {
        return this.panelElements[panelId];
    }

    updatePanel(panelId, content) {
        const panel = this.panels[panelId];
        if (panel && panel.element) {
            const contentElement = panel.element.querySelector('.panel-content');
            if (contentElement) {
                contentElement.innerHTML = content;
            }
        }
    }
}