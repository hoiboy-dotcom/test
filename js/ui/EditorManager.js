export class EditorManager {
    constructor(gameState, uiManager, renderer) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.renderer = renderer;
        this.editorWindows = {};
        this.currentWindow = null;
        this.windowPositions = {};
        this.imageCache = new Map();
        this.currentEditingItem = null;
        this.currentEditingMonster = null;
        this.currentEditingSkill = null;
        this.currentEditingEvent = null;
        
        console.log('EditorManager initializing...');
        this.initializeEditors();
        this.setupEventListeners();
        this.populateEditors();
        
        console.log('EditorManager initialized');
    }

    initializeEditors() {
        // Get all editor windows
        this.editorWindows = {
            item: document.getElementById('itemEditorWindow'),
            character: document.getElementById('characterEditorWindow'),
            monster: document.getElementById('monsterEditorWindow'),
            skill: document.getElementById('skillEditorWindow'),
            event: document.getElementById('eventEditorWindow')
        };
        
        // Load saved positions
        this.loadWindowPositions();
        
        // Make windows draggable
        Object.values(this.editorWindows).forEach(window => {
            if (window) {
                this.makeWindowDraggable(window);
                this.setupEditorTabs(window);
            }
        });
        
        // Initialize editor content - FIXED: Use the actual methods
        this.initializeItemEditor();
        this.initializeCharacterEditor();
        this.initializeMonsterEditor();
        this.initializeSkillEditor();
        this.initializeEventEditor();
    }

    makeWindowDraggable(window) {
        const header = window.querySelector('.panel-header');
        if (!header) return;
        
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('close-btn') || 
                e.target.classList.contains('panel-btn')) {
                return;
            }
            
            isDragging = true;
            offset.x = e.clientX - window.offsetLeft;
            offset.y = e.clientY - window.offsetTop;
            this.bringToFront(window);
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !window) return;
            
            window.style.left = `${e.clientX - offset.x}px`;
            window.style.top = `${e.clientY - offset.y}px`;
            
            // Keep within window bounds
            const rect = window.getBoundingClientRect();
            if (rect.left < 0) window.style.left = '0px';
            if (rect.top < 0) window.style.top = '0px';
            if (rect.right > window.innerWidth) window.style.left = `${window.innerWidth - rect.width}px`;
            if (rect.bottom > window.innerHeight) window.style.top = `${window.innerHeight - rect.height}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.saveWindowPositions();
            }
        });
    }

    bringToFront(window) {
        Object.values(this.editorWindows).forEach(w => {
            if (w && w !== window) w.style.zIndex = '10000';
        });
        window.style.zIndex = '10001';
        this.currentWindow = window;
    }

    setupEditorTabs(editorWindow) {
        const tabs = editorWindow.querySelectorAll('.editor-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchEditorTab(editorWindow, tabId);
            });
        });
    }

    switchEditorTab(editorWindow, tabId) {
        if (!editorWindow) return;
        
        // Update active tab
        editorWindow.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Show corresponding content
        editorWindow.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }

    // Item Editor Methods
    initializeItemEditor() {
        const editorWindow = this.editorWindows.item;
        if (!editorWindow) return;
        
        const editorContent = editorWindow.querySelector('.editor-content');
        if (!editorContent) return;
        
        // Create tab content
        editorContent.innerHTML = `
            <div class="tab-content active" id="tab-create">
                ${this.getItemCreateForm()}
            </div>
            <div class="tab-content" id="tab-edit">
                ${this.getItemEditForm()}
            </div>
            <div class="tab-content" id="tab-list">
                <div id="itemListContainer"></div>
            </div>
        `;
    }

    getItemCreateForm() {
        return `
            <div class="form-group">
                <label for="itemName">Name</label>
                <input type="text" id="itemName" class="form-control" placeholder="Item Name">
            </div>
            <div class="form-group">
                <label for="itemType">Type</label>
                <select id="itemType" class="form-control">
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="helm">Helm</option>
                    <option value="gloves">Gloves</option>
                    <option value="pants">Pants</option>
                    <option value="boots">Boots</option>
                    <option value="ring">Ring</option>
                    <option value="amulet">Amulet</option>
                    <option value="wings">Wings</option>
                    <option value="pet">Pet</option>
                    <option value="shield">Shield</option>
                    <option value="potion">Potion</option>
                    <option value="scroll">Scroll</option>
                </select>
            </div>
            <div class="form-group">
                <label for="itemRarity">Rarity</label>
                <select id="itemRarity" class="form-control">
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                </select>
            </div>
            <div class="form-group">
                <label for="itemLevel">Item Level</label>
                <div class="number-input">
                    <input type="number" id="itemLevel" min="1" max="400" value="1" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label for="itemDropRate">Drop Rate %</label>
                <div class="number-input">
                    <input type="number" id="itemDropRate" min="0.01" max="100" step="0.01" value="1" class="form-control">
                    <span>%</span>
                </div>
            </div>
            <div class="form-group">
                <label>Item Size</label>
                <div class="item-size-input">
                    <input type="number" id="itemWidth" min="1" max="4" value="1" class="form-control" placeholder="Width">
                    <span>x</span>
                    <input type="number" id="itemHeight" min="1" max="4" value="1" class="form-control" placeholder="Height">
                </div>
            </div>
            <div class="form-group">
                <label for="itemImage">Image</label>
                <select id="itemImage" class="form-control">
                    <option value="">Select Image</option>
                </select>
                <div class="image-selector" id="itemImagePreview"></div>
            </div>
            <div class="form-group">
                <label>Select Stats</label>
                <div class="stats-selector" id="statsSelector">
                    <div class="stat-option" data-stat="strength">Strength</div>
                    <div class="stat-option" data-stat="agility">Agility</div>
                    <div class="stat-option" data-stat="vitality">Vitality</div>
                    <div class="stat-option" data-stat="energy">Energy</div>
                    <div class="stat-option" data-stat="damage">Damage</div>
                    <div class="stat-option" data-stat="defense">Defense</div>
                    <div class="stat-option" data-stat="accuracy">Accuracy</div>
                    <div class="stat-option" data-stat="critical">Critical</div>
                    <div class="stat-option" data-stat="hp">HP</div>
                    <div class="stat-option" data-stat="mp">MP</div>
                </div>
            </div>
            <div class="form-group">
                <label for="itemStats">Stats (JSON)</label>
                <textarea id="itemStats" class="form-control" rows="4" placeholder='{"strength":5,"damage":"10-15"}'></textarea>
            </div>
            <div class="form-group">
                <label for="itemDescription">Description</label>
                <textarea id="itemDescription" class="form-control" rows="2" placeholder="Item description"></textarea>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="itemStackable"> Stackable</label>
            </div>
            <div class="btn-group">
                <button class="btn btn-full" id="createItemBtn">Create</button>
                <button class="btn btn-full" id="spawnItemBtn">Spawn</button>
            </div>
        `;
    }

    getItemEditForm() {
        return `
            <div class="form-group">
                <label for="editItemSelect">Select Item</label>
                <select id="editItemSelect" class="form-control"></select>
            </div>
            <div id="editItemForm" style="display:none;">
                <div class="form-group">
                    <label for="editItemName">Name</label>
                    <input type="text" id="editItemName" class="form-control">
                </div>
                <div class="form-group">
                    <label for="editItemType">Type</label>
                    <select id="editItemType" class="form-control">
                        <option value="weapon">Weapon</option>
                        <option value="armor">Armor</option>
                        <option value="helm">Helm</option>
                        <option value="gloves">Gloves</option>
                        <option value="pants">Pants</option>
                        <option value="boots">Boots</option>
                        <option value="ring">Ring</option>
                        <option value="amulet">Amulet</option>
                        <option value="wings">Wings</option>
                        <option value="pet">Pet</option>
                        <option value="shield">Shield</option>
                        <option value="potion">Potion</option>
                        <option value="scroll">Scroll</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editItemRarity">Rarity</label>
                    <select id="editItemRarity" class="form-control">
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editItemLevel">Level</label>
                    <input type="number" id="editItemLevel" class="form-control">
                </div>
                <div class="form-group">
                    <label for="editItemDropRate">Drop Rate %</label>
                    <input type="number" id="editItemDropRate" class="form-control">
                </div>
                <div class="form-group">
                    <label for="editItemImage">Image</label>
                    <select id="editItemImage" class="form-control">
                        <option value="">Select Image</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editItemStats">Stats (JSON)</label>
                    <textarea id="editItemStats" class="form-control" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label for="editItemDescription">Description</label>
                    <textarea id="editItemDescription" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="editItemStackable"> Stackable</label>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="saveItemBtn">Save</button>
                    <button class="btn btn-full" id="deleteItemBtn" style="background:linear-gradient(45deg,#e94560,#c2185b)">Delete</button>
                </div>
            </div>
        `;
    }

    // Character Editor Methods
    initializeCharacterEditor() {
        const editorWindow = this.editorWindows.character;
        if (!editorWindow) return;
        
        const editorContent = editorWindow.querySelector('.editor-content');
        if (!editorContent) return;
        
        editorContent.innerHTML = `
            <div class="tab-content active" id="tab-stats">
                <div class="form-group">
                    <label for="editLevel">Level</label>
                    <div class="number-input">
                        <input type="number" id="editLevel" min="1" max="400" value="1" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editStrength">Strength</label>
                    <div class="number-input">
                        <input type="number" id="editStrength" min="1" max="5000" value="20" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editAgility">Agility</label>
                    <div class="number-input">
                        <input type="number" id="editAgility" min="1" max="5000" value="15" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editVitality">Vitality</label>
                    <div class="number-input">
                        <input type="number" id="editVitality" min="1" max="5000" value="25" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editEnergy">Energy</label>
                    <div class="number-input">
                        <input type="number" id="editEnergy" min="1" max="5000" value="10" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editClass">Class</label>
                    <select id="editClass" class="form-control">
                        <option value="Dark Knight">Dark Knight</option>
                        <option value="Elf">Elf</option>
                        <option value="Wizard">Wizard</option>
                        <option value="Summoner">Summoner</option>
                    </select>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="applyStatsBtn">Apply</button>
                    <button class="btn btn-full" id="resetStatsBtn">Reset</button>
                </div>
            </div>
            <div class="tab-content" id="tab-appearance">
                <div class="form-group">
                    <label for="charImage">Upload Image</label>
                    <input type="file" id="charImage" accept="image/*" class="form-control">
                </div>
                <div class="form-group">
                    <label>Current Image</label>
                    <div class="image-preview" id="charImagePreview"><span>No image</span></div>
                </div>
                <div class="form-group">
                    <label for="charColor">Color</label>
                    <input type="color" id="charColor" value="#0f3460" class="form-control" style="height:40px">
                </div>
                <div class="form-group">
                    <label>OR Select from Database</label>
                    <select id="charImageSelect" class="form-control">
                        <option value="">Select Character Image</option>
                        <option value="dark_knight.png">Dark Knight</option>
                        <option value="elf.png">Elf</option>
                        <option value="wizard.png">Wizard</option>
                        <option value="summoner.png">Summoner</option>
                    </select>
                    <div class="image-selector" id="charImageSelector">
                        <div class="image-option" data-value="dark_knight.png">
                            <div style="width:100%;height:100%;background:#0f3460;display:flex;align-items:center;justify-content:center;color:white;">DK</div>
                        </div>
                        <div class="image-option" data-value="elf.png">
                            <div style="width:100%;height:100%;background:#2d7d32;display:flex;align-items:center;justify-content:center;color:white;">Elf</div>
                        </div>
                        <div class="image-option" data-value="wizard.png">
                            <div style="width:100%;height:100%;background:#9c27b0;display:flex;align-items:center;justify-content:center;color:white;">Wiz</div>
                        </div>
                        <div class="image-option" data-value="summoner.png">
                            <div style="width:100%;height:100%;background:#ff9800;display:flex;align-items:center;justify-content:center;color:white;">Sum</div>
                        </div>
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="saveCharImageBtn">Save</button>
                </div>
            </div>
        `;
    }

    // Monster Editor Methods
    initializeMonsterEditor() {
        const editorWindow = this.editorWindows.monster;
        if (!editorWindow) return;
        
        const editorContent = editorWindow.querySelector('.editor-content');
        if (!editorContent) return;
        
        editorContent.innerHTML = `
            <div class="tab-content active" id="tab-create">
                <div class="form-group">
                    <label for="monsterName">Name</label>
                    <input type="text" id="monsterName" class="form-control" placeholder="Monster Name">
                </div>
                <div class="form-group">
                    <label for="monsterLevel">Level</label>
                    <div class="number-input">
                        <input type="number" id="monsterLevel" min="1" max="400" value="1" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="monsterType">Type</label>
                    <select id="monsterType" class="form-control">
                        <option value="goblin">Goblin</option>
                        <option value="orc">Orc</option>
                        <option value="dragon">Dragon</option>
                        <option value="demon">Demon</option>
                        <option value="undead">Undead</option>
                        <option value="beast">Beast</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="monsterHP">HP</label>
                    <div class="number-input">
                        <input type="number" id="monsterHP" min="10" max="5000" value="100" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="monsterDamage">Damage</label>
                    <div class="number-input">
                        <input type="number" id="monsterDamage" min="1" max="500" value="20" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="monsterEXP">EXP</label>
                    <div class="number-input">
                        <input type="number" id="monsterEXP" min="1" max="10000" value="100" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="monsterDropRate">Drop Rate %</label>
                    <div class="number-input">
                        <input type="number" id="monsterDropRate" min="0" max="100" value="30" class="form-control">
                        <span>%</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="monsterColor">Color</label>
                    <input type="color" id="monsterColor" value="#ff5252" class="form-control" style="height:40px">
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="createMonsterBtn">Create</button>
                    <button class="btn btn-full" id="spawnMonsterBtn">Spawn</button>
                </div>
            </div>
            <div class="tab-content" id="tab-edit">
                <div class="form-group">
                    <label for="editMonsterSelect">Select Monster</label>
                    <select id="editMonsterSelect" class="form-control"></select>
                </div>
                <div id="editMonsterForm" style="display:none;">
                    <div class="form-group">
                        <label for="editMonsterName">Name</label>
                        <input type="text" id="editMonsterName" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="editMonsterLevel">Level</label>
                        <input type="number" id="editMonsterLevel" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="editMonsterHP">HP</label>
                        <input type="number" id="editMonsterHP" class="form-control">
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-full" id="saveMonsterBtn">Save</button>
                        <button class="btn btn-full" id="deleteMonsterBtn" style="background:linear-gradient(45deg,#e94560,#c2185b)">Delete</button>
                    </div>
                </div>
            </div>
            <div class="tab-content" id="tab-spawn">
                <div class="form-group">
                    <label for="spawnMonsterSelect">Select Monster</label>
                    <select id="spawnMonsterSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                    <label for="spawnCount">Count</label>
                    <div class="number-input">
                        <input type="number" id="spawnCount" min="1" max="20" value="1" class="form-control">
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="spawnSelectedBtn">Spawn</button>
                    <button class="btn btn-full" id="clearMonstersBtn" style="background:linear-gradient(45deg,#e94560,#c2185b)">Clear All</button>
                </div>
            </div>
            <div class="tab-content" id="tab-image">
                <div class="form-group">
                    <label for="monsterImage">Upload Image/GIF</label>
                    <input type="file" id="monsterImage" accept="image/*,.gif" class="form-control">
                </div>
                <div class="form-group">
                    <label>Preview</label>
                    <div class="image-preview" id="monsterImagePreview"><span>No image</span></div>
                </div>
                <div class="form-group">
                    <label for="animationSpeed">Animation Speed (ms)</label>
                    <div class="number-input">
                        <input type="number" id="animationSpeed" min="100" max="5000" value="500" class="form-control">
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="saveMonsterImageBtn">Save Image</button>
                </div>
            </div>
        `;
    }

    // Skill Editor Methods
    initializeSkillEditor() {
        const editorWindow = this.editorWindows.skill;
        if (!editorWindow) return;
        
        const editorContent = editorWindow.querySelector('.editor-content');
        if (!editorContent) return;
        
        editorContent.innerHTML = `
            <div class="tab-content active" id="tab-create">
                <div class="form-group">
                    <label for="skillName">Name</label>
                    <input type="text" id="skillName" class="form-control" placeholder="Skill Name">
                </div>
                <div class="form-group">
                    <label for="skillType">Type</label>
                    <select id="skillType" class="form-control">
                        <option value="attack">Attack</option>
                        <option value="heal">Heal</option>
                        <option value="buff">Buff</option>
                        <option value="debuff">Debuff</option>
                        <option value="summon">Summon</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="skillLevelReq">Level Requirement</label>
                    <div class="number-input">
                        <input type="number" id="skillLevelReq" min="1" max="400" value="1" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="skillManaCost">Mana Cost</label>
                    <div class="number-input">
                        <input type="number" id="skillManaCost" min="0" max="1000" value="10" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="skillDamage">Damage</label>
                    <div class="number-input">
                        <input type="number" id="skillDamage" min="0" max="10000" value="50" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="skillCooldown">Cooldown (s)</label>
                    <div class="number-input">
                        <input type="number" id="skillCooldown" min="0" max="300" value="5" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="skillRange">Range</label>
                    <div class="number-input">
                        <input type="number" id="skillRange" min="0" max="1000" value="100" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="skillDescription">Description</label>
                    <textarea id="skillDescription" class="form-control" rows="2" placeholder="Skill description"></textarea>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="createSkillBtn">Create</button>
                    <button class="btn btn-full" id="addToSkillbookBtn">Add to Skillbook</button>
                </div>
            </div>
            <div class="tab-content" id="tab-edit">
                <div class="form-group">
                    <label for="editSkillSelect">Select Skill</label>
                    <select id="editSkillSelect" class="form-control"></select>
                </div>
                <div id="editSkillForm" style="display:none;">
                    <div class="form-group">
                        <label for="editSkillName">Name</label>
                        <input type="text" id="editSkillName" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="editSkillLevelReq">Level Req</label>
                        <input type="number" id="editSkillLevelReq" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="editSkillDamage">Damage</label>
                        <input type="number" id="editSkillDamage" class="form-control">
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-full" id="saveSkillBtn">Save</button>
                        <button class="btn btn-full" id="deleteSkillBtn" style="background:linear-gradient(45deg,#e94560,#c2185b)">Delete</button>
                    </div>
                </div>
            </div>
            <div class="tab-content" id="tab-list">
                <div id="skillListContainer"></div>
            </div>
        `;
    }

    // Event Editor Methods
    initializeEventEditor() {
        const editorWindow = this.editorWindows.event;
        if (!editorWindow) return;
        
        const editorContent = editorWindow.querySelector('.editor-content');
        if (!editorContent) return;
        
        editorContent.innerHTML = `
            <div class="tab-content active" id="tab-create">
                <div class="form-group">
                    <label for="eventName">Name</label>
                    <input type="text" id="eventName" class="form-control" placeholder="Event Name">
                </div>
                <div class="form-group">
                    <label for="eventType">Type</label>
                    <select id="eventType" class="form-control">
                        <option value="invasion">Monster Invasion</option>
                        <option value="boss">Boss Spawn</option>
                        <option value="buff">Experience Buff</option>
                        <option value="drop">Drop Rate Increase</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventDuration">Duration (min)</label>
                    <div class="number-input">
                        <input type="number" id="eventDuration" min="1" max="240" value="5" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="eventInterval">Interval (min)</label>
                    <div class="number-input">
                        <input type="number" id="eventInterval" min="5" max="1440" value="60" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="eventMonster">Monster</label>
                    <select id="eventMonster" class="form-control"></select>
                </div>
                <div class="form-group">
                    <label for="eventCount">Count</label>
                    <div class="number-input">
                        <input type="number" id="eventCount" min="1" max="100" value="10" class="form-control">
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-full" id="createEventBtn">Create</button>
                    <button class="btn btn-full" id="startEventBtn">Start Now</button>
                </div>
            </div>
            <div class="tab-content" id="tab-edit">
                <div id="eventListContainer"></div>
                <div id="selectedEventControls" style="display:none;margin-top:20px;">
                    <div class="btn-group">
                        <button class="btn btn-full" id="editSelectedEventBtn">Edit Selected</button>
                        <button class="btn btn-full" id="startSelectedEventBtn">Start Selected</button>
                    </div>
                </div>
            </div>
            <div class="tab-content" id="tab-schedule">
                <div class="form-group">
                    <label>Active Events</label>
                    <div id="activeEventsList"></div>
                </div>
                <div class="form-group">
                    <label>Next Event</label>
                    <div id="nextEventInfo"></div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Editor menu
        const editorMenuBtn = document.getElementById('editorMenuBtn');
        const editorDropdown = document.getElementById('editorDropdown');
        
        if (editorMenuBtn && editorDropdown) {
            editorMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editorDropdown.classList.toggle('show');
            });
            
            document.addEventListener('click', (e) => {
                if (!editorDropdown.contains(e.target) && e.target !== editorMenuBtn) {
                    editorDropdown.classList.remove('show');
                }
            });
        }
        
        // Open editors
        document.getElementById('openItemEditor')?.addEventListener('click', () => {
            this.openEditor('item');
        });
        
        document.getElementById('openCharacterEditor')?.addEventListener('click', () => {
            this.openEditor('character');
        });
        
        document.getElementById('openMonsterEditor')?.addEventListener('click', () => {
            this.openEditor('monster');
        });
        
        document.getElementById('openSkillEditor')?.addEventListener('click', () => {
            this.openEditor('skill');
        });
        
        document.getElementById('openEventEditor')?.addEventListener('click', () => {
            this.openEditor('event');
        });
        
        // Close buttons
        document.querySelectorAll('.editor-window .close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const window = e.target.closest('.editor-window');
                this.closeEditor(window);
            });
        });
        
        // Item editor events
        this.setupItemEditorEvents();
        
        // Character editor events
        this.setupCharacterEditorEvents();
        
        // Monster editor events
        this.setupMonsterEditorEvents();
        
        // Skill editor events
        this.setupSkillEditorEvents();
        
        // Event editor events
        this.setupEventEditorEvents();
    }

    setupItemEditorEvents() {
        // Create item button
        document.getElementById('createItemBtn')?.addEventListener('click', () => {
            this.createItem();
        });
        
        // Spawn item button
        document.getElementById('spawnItemBtn')?.addEventListener('click', () => {
            this.spawnItem();
        });
        
        // Stats selector
        const statsSelector = document.getElementById('statsSelector');
        if (statsSelector) {
            statsSelector.querySelectorAll('.stat-option').forEach(option => {
                option.addEventListener('click', () => {
                    option.classList.toggle('selected');
                    this.updateItemStatsText();
                });
            });
        }
        
        // Item select for editing
        const editItemSelect = document.getElementById('editItemSelect');
        if (editItemSelect) {
            editItemSelect.addEventListener('change', (e) => {
                const itemId = parseInt(e.target.value);
                if (itemId) {
                    this.loadItemForEdit(itemId);
                }
            });
        }
        
        // Save item button
        document.getElementById('saveItemBtn')?.addEventListener('click', () => {
            if (this.currentEditingItem) {
                this.saveItem(this.currentEditingItem.id);
            }
        });
        
        // Delete item button
        document.getElementById('deleteItemBtn')?.addEventListener('click', () => {
            if (this.currentEditingItem) {
                this.deleteItem(this.currentEditingItem.id);
            }
        });
    }

    setupCharacterEditorEvents() {
        document.getElementById('applyStatsBtn')?.addEventListener('click', () => {
            this.applyCharacterStats();
        });
        
        document.getElementById('resetStatsBtn')?.addEventListener('click', () => {
            this.resetCharacterStats();
        });
        
        document.getElementById('saveCharImageBtn')?.addEventListener('click', () => {
            this.saveCharImage();
        });
        
        // Character image selector
        const charImageSelector = document.getElementById('charImageSelector');
        if (charImageSelector) {
            charImageSelector.querySelectorAll('.image-option').forEach(option => {
                option.addEventListener('click', () => {
                    charImageSelector.querySelectorAll('.image-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    
                    const value = option.dataset.value;
                    document.getElementById('charImageSelect').value = value;
                    
                    const preview = document.getElementById('charImagePreview');
                    preview.innerHTML = `<div style="width:100%;height:100%;background:${
                        value === 'dark_knight.png' ? '#0f3460' :
                        value === 'elf.png' ? '#2d7d32' :
                        value === 'wizard.png' ? '#9c27b0' :
                        value === 'summoner.png' ? '#ff9800' : '#333'
                    };display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${value.replace('.png', '')}</div>`;
                });
            });
        }
    }

    setupMonsterEditorEvents() {
        // Create monster
        document.getElementById('createMonsterBtn')?.addEventListener('click', () => {
            this.createMonster();
        });
        
        // Spawn monster from editor
        document.getElementById('spawnMonsterBtn')?.addEventListener('click', () => {
            this.spawnMonsterFromEditor();
        });
        
        // Spawn selected monster
        document.getElementById('spawnSelectedBtn')?.addEventListener('click', () => {
            this.spawnSelectedMonster();
        });
        
        // Clear all monsters
        document.getElementById('clearMonstersBtn')?.addEventListener('click', () => {
            this.clearAllMonsters();
        });
        
        // Monster select for editing
        const editMonsterSelect = document.getElementById('editMonsterSelect');
        if (editMonsterSelect) {
            editMonsterSelect.addEventListener('change', (e) => {
                const monsterId = parseInt(e.target.value);
                if (monsterId) {
                    this.loadMonsterForEdit(monsterId);
                }
            });
        }
    }

    setupSkillEditorEvents() {
        // Create skill
        document.getElementById('createSkillBtn')?.addEventListener('click', () => {
            this.createSkill();
        });
        
        // Add to skillbook
        document.getElementById('addToSkillbookBtn')?.addEventListener('click', () => {
            this.addSkillToSkillbook();
        });
        
        // Skill select for editing
        const editSkillSelect = document.getElementById('editSkillSelect');
        if (editSkillSelect) {
            editSkillSelect.addEventListener('change', (e) => {
                const skillId = parseInt(e.target.value);
                if (skillId) {
                    this.loadSkillForEdit(skillId);
                }
            });
        }
    }

    setupEventEditorEvents() {
        // Create event
        document.getElementById('createEventBtn')?.addEventListener('click', () => {
            this.createEvent();
        });
        
        // Start event
        document.getElementById('startEventBtn')?.addEventListener('click', () => {
            this.startEventFromEditor();
        });
        
        // Edit selected event
        document.getElementById('editSelectedEventBtn')?.addEventListener('click', () => {
            if (this.currentEditingEvent) {
                this.editSelectedEvent(this.currentEditingEvent.id);
            }
        });
        
        // Start selected event
        document.getElementById('startSelectedEventBtn')?.addEventListener('click', () => {
            if (this.currentEditingEvent) {
                this.startSelectedEvent(this.currentEditingEvent.id);
            }
        });
    }

    async populateEditors() {
        await this.populateItemEditor();
        await this.populateCharacterEditor();
        await this.populateMonsterEditor();
        await this.populateSkillEditor();
        await this.populateEventEditor();
    }

    async populateItemEditor() {
        // Load available images
        const availableImages = await this.gameState.db.getAvailableImages('items');
        const imageSelect = document.getElementById('itemImage');
        const editImageSelect = document.getElementById('editItemImage');
        
        if (imageSelect) {
            imageSelect.innerHTML = '<option value="">Select Image</option>';
            availableImages.forEach(image => {
                const option = document.createElement('option');
                option.value = image;
                option.textContent = image.replace('.png', '').replace('.jpg', '').replace('_', ' ');
                imageSelect.appendChild(option);
            });
        }
        
        if (editImageSelect) {
            editImageSelect.innerHTML = '<option value="">Select Image</option>';
            availableImages.forEach(image => {
                const option = document.createElement('option');
                option.value = image;
                option.textContent = image.replace('.png', '').replace('.jpg', '').replace('_', ' ');
                editImageSelect.appendChild(option);
            });
        }
        
        // Populate image preview
        const imagePreview = document.getElementById('itemImagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
            for (const image of availableImages) {
                const imageUrl = await this.gameState.db.getImageUrl(image, 'items');
                if (imageUrl) {
                    const option = this.createImageOption(image, imageUrl, 'itemImage');
                    imagePreview.appendChild(option);
                }
            }
        }
        
        // Populate item list for editing
        this.populateItemList();
    }

    createImageOption(imageName, imageUrl, targetInputId) {
        const option = document.createElement('div');
        option.className = 'image-option';
        option.dataset.value = imageName;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = imageName;
        img.title = imageName;
        
        option.appendChild(img);
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.image-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            
            const input = document.getElementById(targetInputId);
            if (input) {
                input.value = imageName;
            }
        });
        
        return option;
    }

    populateItemList() {
        const editItemSelect = document.getElementById('editItemSelect');
        const itemListContainer = document.getElementById('itemListContainer');
        
        if (!editItemSelect && !itemListContainer) return;
        
        if (editItemSelect) {
            editItemSelect.innerHTML = '<option value="">Select an item...</option>';
            this.gameState.db.items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (Lv.${item.level} ${item.rarity})`;
                editItemSelect.appendChild(option);
            });
        }
        
        if (itemListContainer) {
            let html = '<div style="display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto;">';
            this.gameState.db.items.forEach(item => {
                const rarityColors = {
                    common: '#ffffff',
                    uncommon: '#448aff',
                    rare: '#ffd740',
                    epic: '#e94560',
                    legendary: '#ff9800'
                };
                
                html += `<div class="event-list-item" data-id="${item.id}">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:30px;height:30px;background:${
                            rarityColors[item.rarity] || '#ffffff'
                        };border-radius:5px;border:2px solid #e94560;"></div>
                        <div>
                            <div style="font-weight:bold;margin-bottom:2px;">${item.name}</div>
                            <div style="font-size:11px;color:rgba(255,255,255,0.7);">
                                Lv.${item.level} | ${item.type} | ${item.rarity} | Drop: ${item.dropRate}%
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            itemListContainer.innerHTML = html;
            
            // Add click handlers
            itemListContainer.querySelectorAll('.event-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const itemId = parseInt(item.dataset.id);
                    this.loadItemForEdit(itemId);
                    this.switchEditorTab(this.editorWindows.item, 'edit');
                });
            });
        }
    }

    loadItemForEdit(itemId) {
        const item = this.gameState.db.getItemById(itemId);
        if (!item) return;
        
        this.currentEditingItem = item;
        
        // Populate all edit fields
        document.getElementById('editItemName').value = item.name || '';
        document.getElementById('editItemType').value = item.type || 'weapon';
        document.getElementById('editItemRarity').value = item.rarity || 'common';
        document.getElementById('editItemLevel').value = item.level || 1;
        document.getElementById('editItemDropRate').value = item.dropRate || 1;
        document.getElementById('editItemImage').value = item.image || '';
        document.getElementById('editItemStats').value = JSON.stringify(item.stats || {}, null, 2);
        document.getElementById('editItemDescription').value = item.description || '';
        document.getElementById('editItemStackable').checked = item.stackable || false;
        
        // Update stats selector
        if (item.stats) {
            document.querySelectorAll('#statsSelector .stat-option').forEach(option => {
                const stat = option.dataset.stat;
                option.classList.toggle('selected', item.stats[stat] !== undefined);
            });
        }
        
        document.getElementById('editItemForm').style.display = 'block';
    }

    updateItemStatsText() {
        const selectedStats = [];
        document.querySelectorAll('#statsSelector .stat-option.selected').forEach(option => {
            const stat = option.dataset.stat;
            let value = '';
            
            switch(stat) {
                case 'strength': value = '5'; break;
                case 'agility': value = '3'; break;
                case 'vitality': value = '10'; break;
                case 'energy': value = '2'; break;
                case 'damage': value = '"10-15"'; break;
                case 'defense': value = '5'; break;
                case 'accuracy': value = '5'; break;
                case 'critical': value = '2'; break;
                case 'hp': value = '50'; break;
                case 'mp': value = '30'; break;
            }
            
            selectedStats.push(`"${stat}": ${value}`);
        });
        
        const statsText = selectedStats.length > 0 ? `{${selectedStats.join(', ')}}` : '{}';
        document.getElementById('itemStats').value = statsText;
    }

    createItem() {
        const name = document.getElementById('itemName').value;
        const type = document.getElementById('itemType').value;
        const rarity = document.getElementById('itemRarity').value;
        const level = parseInt(document.getElementById('itemLevel').value);
        const dropRate = parseFloat(document.getElementById('itemDropRate').value);
        const width = parseInt(document.getElementById('itemWidth').value);
        const height = parseInt(document.getElementById('itemHeight').value);
        const image = document.getElementById('itemImage').value;
        const statsText = document.getElementById('itemStats').value;
        const description = document.getElementById('itemDescription').value;
        const stackable = document.getElementById('itemStackable').checked;
        
        if (!name) {
            this.uiManager.showNotification('Enter item name');
            return;
        }
        
        try {
            const stats = JSON.parse(statsText);
            const itemData = {
                name, type, rarity, level, dropRate, width, height, image, stats, description, stackable
            };
            
            const newItem = this.gameState.db.addItem(itemData);
            this.uiManager.showNotification(`Item "${newItem.name}" created!`);
            this.populateItemList();
            this.uiManager.updateUI();
        } catch (e) {
            this.uiManager.showNotification('Invalid JSON in stats');
        }
    }

    spawnItem() {
        const name = document.getElementById('itemName').value;
        if (!name) {
            this.uiManager.showNotification('Create item first');
            return;
        }
        
        const emptySlot = this.gameState.inventory.items.findIndex(slot => !slot);
        if (emptySlot !== -1) {
            const itemData = {
                name: document.getElementById('itemName').value,
                type: document.getElementById('itemType').value,
                rarity: document.getElementById('itemRarity').value,
                level: parseInt(document.getElementById('itemLevel').value),
                dropRate: parseFloat(document.getElementById('itemDropRate').value),
                width: parseInt(document.getElementById('itemWidth').value),
                height: parseInt(document.getElementById('itemHeight').value),
                image: document.getElementById('itemImage').value,
                description: document.getElementById('itemDescription').value,
                stackable: document.getElementById('itemStackable').checked
            };
            
            try {
                itemData.stats = JSON.parse(document.getElementById('itemStats').value);
            } catch (e) {
                this.uiManager.showNotification('Invalid JSON in stats');
                return;
            }
            
            const newItem = this.gameState.db.addItem(itemData);
            this.gameState.inventory.items[emptySlot] = { ...newItem };
            this.uiManager.updateUI();
            this.uiManager.showNotification(`Item "${newItem.name}" added to inventory!`);
        } else {
            this.uiManager.showNotification('Inventory full!');
        }
    }

    saveItem(itemId) {
        const updates = {
            name: document.getElementById('editItemName').value,
            type: document.getElementById('editItemType').value,
            rarity: document.getElementById('editItemRarity').value,
            level: parseInt(document.getElementById('editItemLevel').value),
            dropRate: parseFloat(document.getElementById('editItemDropRate').value),
            image: document.getElementById('editItemImage').value,
            description: document.getElementById('editItemDescription').value,
            stackable: document.getElementById('editItemStackable').checked
        };
        
        try {
            updates.stats = JSON.parse(document.getElementById('editItemStats').value);
        } catch (e) {
            this.uiManager.showNotification('Invalid JSON in stats');
            return;
        }
        
        if (this.gameState.db.updateItem(itemId, updates)) {
            this.populateItemList();
            this.uiManager.updateUI();
            this.uiManager.showNotification('Item updated!');
        }
    }

    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            if (this.gameState.db.deleteItem(itemId)) {
                this.populateItemList();
                const editForm = document.getElementById('editItemForm');
                if (editForm) editForm.style.display = 'none';
                this.uiManager.showNotification('Item deleted!');
            }
        }
    }

    populateCharacterEditor() {
        const player = this.gameState.player;
        const editLevel = document.getElementById('editLevel');
        const editStrength = document.getElementById('editStrength');
        const editAgility = document.getElementById('editAgility');
        const editVitality = document.getElementById('editVitality');
        const editEnergy = document.getElementById('editEnergy');
        const editClass = document.getElementById('editClass');
        
        if (editLevel) editLevel.value = player.level;
        if (editStrength) editStrength.value = player.stats.strength;
        if (editAgility) editAgility.value = player.stats.agility;
        if (editVitality) editVitality.value = player.stats.vitality;
        if (editEnergy) editEnergy.value = player.stats.energy;
        if (editClass) editClass.value = player.class;
        
        // Show current character image
        const preview = document.getElementById('charImagePreview');
        if (player.image) {
            preview.innerHTML = `<div style="width:100%;height:100%;background:#0f3460;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${player.class}</div>`;
        }
    }

    applyCharacterStats() {
        const level = parseInt(document.getElementById('editLevel').value);
        const strength = parseInt(document.getElementById('editStrength').value);
        const agility = parseInt(document.getElementById('editAgility').value);
        const vitality = parseInt(document.getElementById('editVitality').value);
        const energy = parseInt(document.getElementById('editEnergy').value);
        const charClass = document.getElementById('editClass').value;
        
        this.gameState.player.level = level;
        this.gameState.player.stats.strength = strength;
        this.gameState.player.stats.agility = agility;
        this.gameState.player.stats.vitality = vitality;
        this.gameState.player.stats.energy = energy;
        this.gameState.player.class = charClass;
        
        const derived = this.gameState.calculateDerivedStats();
        this.gameState.player.hp.max = derived.hpMax;
        this.gameState.player.mp.max = derived.mpMax;
        this.gameState.player.hp.current = Math.min(this.gameState.player.hp.current, derived.hpMax);
        this.gameState.player.mp.current = Math.min(this.gameState.player.mp.current, derived.mpMax);
        
        this.uiManager.updateUI();
        this.uiManager.showNotification('Character stats updated!');
    }

    resetCharacterStats() {
        this.gameState.player.level = 1;
        this.gameState.player.class = 'Dark Knight';
        this.gameState.player.stats.strength = 20;
        this.gameState.player.stats.agility = 15;
        this.gameState.player.stats.vitality = 25;
        this.gameState.player.stats.energy = 10;
        this.gameState.player.hp = { current: 50, max: 50 };
        this.gameState.player.mp = { current: 20, max: 20 };
        this.gameState.player.xp = { current: 0, max: 100 };
        
        this.populateCharacterEditor();
        this.uiManager.updateUI();
        this.uiManager.showNotification('Character stats reset!');
    }

    saveCharImage() {
        const imageSelect = document.getElementById('charImageSelect');
        const selectedImage = imageSelect?.value;
        
        if (selectedImage) {
            this.gameState.player.image = selectedImage;
            this.uiManager.showNotification('Character image saved!');
            
            const preview = document.getElementById('charImagePreview');
            if (preview) {
                preview.innerHTML = `<div style="width:100%;height:100%;background:${
                    selectedImage === 'dark_knight.png' ? '#0f3460' :
                    selectedImage === 'elf.png' ? '#2d7d32' :
                    selectedImage === 'wizard.png' ? '#9c27b0' :
                    selectedImage === 'summoner.png' ? '#ff9800' : '#333'
                };display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${selectedImage.replace('.png', '')}</div>`;
            }
        } else {
            this.uiManager.showNotification('Select an image first');
        }
    }

    // Monster Editor Methods
    async populateMonsterEditor() {
        // Populate monster selects
        const spawnMonsterSelect = document.getElementById('spawnMonsterSelect');
        const editMonsterSelect = document.getElementById('editMonsterSelect');
        const eventMonster = document.getElementById('eventMonster');
        
        if (spawnMonsterSelect) {
            spawnMonsterSelect.innerHTML = '<option value="">Select a monster...</option>';
            this.gameState.db.monsters.forEach(monster => {
                const option = document.createElement('option');
                option.value = monster.id;
                option.textContent = `${monster.name} (Lv.${monster.level})`;
                spawnMonsterSelect.appendChild(option);
            });
        }
        
        if (editMonsterSelect) {
            editMonsterSelect.innerHTML = '<option value="">Select a monster...</option>';
            this.gameState.db.monsters.forEach(monster => {
                const option = document.createElement('option');
                option.value = monster.id;
                option.textContent = `${monster.name} (Lv.${monster.level})`;
                editMonsterSelect.appendChild(option);
            });
        }
        
        if (eventMonster) {
            eventMonster.innerHTML = '<option value="">Select a monster...</option>';
            this.gameState.db.monsters.forEach(monster => {
                const option = document.createElement('option');
                option.value = monster.id;
                option.textContent = monster.name;
                eventMonster.appendChild(option);
            });
        }
    }

    loadMonsterForEdit(monsterId) {
        const monster = this.gameState.db.getMonsterById(monsterId);
        if (!monster) return;
        
        this.currentEditingMonster = monster;
        
        const editMonsterName = document.getElementById('editMonsterName');
        const editMonsterLevel = document.getElementById('editMonsterLevel');
        const editMonsterHP = document.getElementById('editMonsterHP');
        const editMonsterForm = document.getElementById('editMonsterForm');
        
        if (editMonsterName) editMonsterName.value = monster.name;
        if (editMonsterLevel) editMonsterLevel.value = monster.level;
        if (editMonsterHP) editMonsterHP.value = monster.hp;
        if (editMonsterForm) editMonsterForm.style.display = 'block';
    }

    createMonster() {
        const name = document.getElementById('monsterName').value;
        const level = parseInt(document.getElementById('monsterLevel').value);
        const type = document.getElementById('monsterType').value;
        const hp = parseInt(document.getElementById('monsterHP').value);
        const damage = parseInt(document.getElementById('monsterDamage').value);
        const exp = parseInt(document.getElementById('monsterEXP').value);
        const dropRate = parseInt(document.getElementById('monsterDropRate').value);
        const color = document.getElementById('monsterColor').value;
        
        if (!name) {
            this.uiManager.showNotification('Enter monster name');
            return;
        }
        
        // Generate new ID
        const newId = Math.max(...this.gameState.db.monsters.map(m => m.id), 0) + 1;
        
        const monsterData = { 
            id: newId, 
            name, level, type, hp, damage, exp, dropRate, color,
            image: 'goblin.png' // Default image
        };
        
        this.gameState.db.monsters.push(monsterData);
        this.gameState.db.saveToLocalStorage('monsters');
        
        this.uiManager.showNotification(`Monster "${name}" created!`);
        this.populateMonsterEditor();
    }

    spawnMonsterFromEditor() {
        const name = document.getElementById('monsterName').value;
        if (!name) {
            this.uiManager.showNotification('Create monster first');
            return;
        }
        
        const monsterData = {
            name: document.getElementById('monsterName').value,
            level: parseInt(document.getElementById('monsterLevel').value),
            type: document.getElementById('monsterType').value,
            hp: parseInt(document.getElementById('monsterHP').value),
            damage: parseInt(document.getElementById('monsterDamage').value),
            exp: parseInt(document.getElementById('monsterEXP').value),
            dropRate: parseInt(document.getElementById('monsterDropRate').value),
            color: document.getElementById('monsterColor').value,
            image: 'goblin.png'
        };
        
        this.gameState.spawnMonster(monsterData);
        this.uiManager.showNotification(`Monster "${name}" spawned!`);
    }

    spawnSelectedMonster() {
        const select = document.getElementById('spawnMonsterSelect');
        const count = parseInt(document.getElementById('spawnCount').value) || 1;
        
        if (!select?.value) {
            this.uiManager.showNotification('Select monster template');
            return;
        }
        
        const monsterId = parseInt(select.value);
        const monsterTemplate = this.gameState.db.getMonsterById(monsterId);
        
        if (!monsterTemplate) {
            this.uiManager.showNotification('Monster template not found');
            return;
        }
        
        const player = this.gameState.player;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 200;
            const x = player.position.x + Math.cos(angle) * distance;
            const y = player.position.y + Math.sin(angle) * distance;
            this.gameState.spawnMonster(monsterTemplate, x, y);
        }
        
        this.uiManager.showNotification(`Spawned ${count} ${monsterTemplate.name}(s)!`);
    }

    clearAllMonsters() {
        if (confirm('Clear all monsters?')) {
            this.gameState.monsters = [];
            this.uiManager.showNotification('All monsters cleared!');
        }
    }

    // Skill Editor Methods
    async populateSkillEditor() {
        const editSkillSelect = document.getElementById('editSkillSelect');
        const skillListContainer = document.getElementById('skillListContainer');
        
        if (editSkillSelect) {
            editSkillSelect.innerHTML = '<option value="">Select a skill...</option>';
            this.gameState.db.skills.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill.id;
                option.textContent = `${skill.name} (Lv.${skill.levelReq})`;
                editSkillSelect.appendChild(option);
            });
        }
        
        if (skillListContainer) {
            let html = '<div style="display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto;">';
            this.gameState.db.skills.forEach(skill => {
                const typeColors = {
                    attack: '#e94560',
                    heal: '#4CAF50',
                    buff: '#448aff',
                    debuff: '#9c27b0',
                    summon: '#ff9800'
                };
                
                html += `<div class="event-list-item" data-id="${skill.id}">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:30px;height:30px;background:${
                            typeColors[skill.type] || '#ffffff'
                        };border-radius:5px;border:2px solid #e94560;"></div>
                        <div>
                            <div style="font-weight:bold;margin-bottom:2px;">${skill.name}</div>
                            <div style="font-size:11px;color:rgba(255,255,255,0.7);">
                                Lv.${skill.levelReq} | ${skill.type} | MP: ${skill.manaCost}
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            skillListContainer.innerHTML = html;
        }
    }

    loadSkillForEdit(skillId) {
        const skill = this.gameState.db.getSkillById(skillId);
        if (!skill) return;
        
        this.currentEditingSkill = skill;
        
        const editSkillName = document.getElementById('editSkillName');
        const editSkillLevelReq = document.getElementById('editSkillLevelReq');
        const editSkillDamage = document.getElementById('editSkillDamage');
        const editSkillForm = document.getElementById('editSkillForm');
        
        if (editSkillName) editSkillName.value = skill.name;
        if (editSkillLevelReq) editSkillLevelReq.value = skill.levelReq;
        if (editSkillDamage) editSkillDamage.value = skill.damage || skill.heal || 0;
        if (editSkillForm) editSkillForm.style.display = 'block';
    }

    createSkill() {
        const name = document.getElementById('skillName').value;
        const type = document.getElementById('skillType').value;
        const levelReq = parseInt(document.getElementById('skillLevelReq').value);
        const manaCost = parseInt(document.getElementById('skillManaCost').value);
        const damage = parseInt(document.getElementById('skillDamage').value);
        const cooldown = parseInt(document.getElementById('skillCooldown').value);
        const range = parseInt(document.getElementById('skillRange').value);
        const description = document.getElementById('skillDescription').value;
        
        if (!name) {
            this.uiManager.showNotification('Enter skill name');
            return;
        }
        
        // Generate new ID
        const newId = Math.max(...this.gameState.db.skills.map(s => s.id), 0) + 1;
        
        const skillData = { 
            id: newId,
            name, type, levelReq, manaCost, cooldown, range, description,
            image: 'power_slash.png' // Default image
        };
        
        if (type === 'attack') skillData.damage = damage;
        else if (type === 'heal') skillData.heal = damage;
        
        this.gameState.db.skills.push(skillData);
        this.gameState.db.saveToLocalStorage('skills');
        
        this.uiManager.showNotification(`Skill "${name}" created!`);
        this.populateSkillEditor();
        this.uiManager.initializeSkillbook();
    }

    addSkillToSkillbook() {
        const name = document.getElementById('skillName').value;
        if (!name) {
            this.uiManager.showNotification('Create skill first');
            return;
        }
        
        // Add to player's learned skills
        const lastSkill = this.gameState.db.skills[this.gameState.db.skills.length - 1];
        if (lastSkill && !this.gameState.player.learnedSkills.includes(lastSkill.id)) {
            this.gameState.player.learnedSkills.push(lastSkill.id);
            this.uiManager.showNotification(`Skill "${name}" added to skillbook!`);
            this.uiManager.initializeSkillbook();
        }
    }

    // Event Editor Methods
    async populateEventEditor() {
        const eventListContainer = document.getElementById('eventListContainer');
        const activeEventsList = document.getElementById('activeEventsList');
        const nextEventInfo = document.getElementById('nextEventInfo');
        
        if (eventListContainer) {
            eventListContainer.innerHTML = '';
            this.gameState.db.events.forEach(event => {
                const eventItem = document.createElement('div');
                eventItem.className = `event-list-item ${event.active ? 'active' : ''}`;
                eventItem.dataset.id = event.id;
                
                eventItem.innerHTML = `
                    <div style="font-weight:bold;">${event.name}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.7);">
                        Type: ${event.type} | Status: ${event.active ? 'Active' : 'Inactive'}
                    </div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.5);">
                        Duration: ${event.duration}s | Interval: ${event.interval}s
                    </div>
                `;
                
                eventItem.addEventListener('click', () => {
                    document.querySelectorAll('.event-list-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    eventItem.classList.add('active');
                    
                    this.currentEditingEvent = event;
                    
                    const selectedControls = document.getElementById('selectedEventControls');
                    if (selectedControls) selectedControls.style.display = 'block';
                });
                
                eventListContainer.appendChild(eventItem);
            });
        }
        
        if (activeEventsList) {
            const activeEvents = this.gameState.db.events.filter(e => e.active);
            if (activeEvents.length > 0) {
                activeEventsList.innerHTML = activeEvents.map(e => 
                    `<div>${e.name} - ${e.type}</div>`
                ).join('');
            } else {
                activeEventsList.innerHTML = '<div style="color:#aaa;">No active events</div>';
            }
        }
        
        if (nextEventInfo) {
            const nextEvent = this.gameState.db.events
                .filter(e => !e.active)
                .sort((a, b) => (a.nextSpawn || 0) - (b.nextSpawn || 0))[0];
            
            if (nextEvent) {
                const timeLeft = nextEvent.nextSpawn ? 
                    Math.max(0, nextEvent.nextSpawn - Date.now()) : 
                    0;
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                
                nextEventInfo.innerHTML = `
                    <div>${nextEvent.name}</div>
                    <div>Starts in: ${minutes}:${seconds.toString().padStart(2, '0')}</div>
                `;
            } else {
                nextEventInfo.innerHTML = '<div style="color:#aaa;">No scheduled events</div>';
            }
        }
    }

    createEvent() {
        const name = document.getElementById('eventName').value;
        const type = document.getElementById('eventType').value;
        const duration = parseInt(document.getElementById('eventDuration').value) * 60;
        const interval = parseInt(document.getElementById('eventInterval').value) * 60;
        const monsterId = parseInt(document.getElementById('eventMonster').value);
        const count = parseInt(document.getElementById('eventCount').value);
        
        if (!name) {
            this.uiManager.showNotification('Enter event name');
            return;
        }
        
        if (!monsterId) {
            this.uiManager.showNotification('Select monster');
            return;
        }
        
        // Generate new ID
        const newId = Math.max(...this.gameState.db.events.map(e => e.id), 0) + 1;
        
        const eventData = {
            id: newId,
            name, type, duration, interval, monsterId, count,
            nextSpawn: Date.now() + interval * 1000,
            active: false
        };
        
        this.gameState.db.events.push(eventData);
        this.gameState.db.saveToLocalStorage('events');
        
        this.uiManager.showNotification(`Event "${name}" created!`);
        this.populateEventEditor();
    }

    startEventFromEditor() {
        const monsterId = parseInt(document.getElementById('eventMonster').value);
        if (!monsterId) {
            this.uiManager.showNotification('Select monster for event');
            return;
        }
        
        const monster = this.gameState.db.getMonsterById(monsterId);
        if (!monster) {
            this.uiManager.showNotification('Monster not found');
            return;
        }
        
        // Spawn event monsters
        const count = parseInt(document.getElementById('eventCount').value) || 10;
        const player = this.gameState.player;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const distance = 300;
            const x = player.position.x + Math.cos(angle) * distance;
            const y = player.position.y + Math.sin(angle) * distance;
            this.gameState.spawnMonster(monster, x, y);
        }
        
        this.uiManager.showNotification(`Event started! Spawned ${count} ${monster.name}(s)!`);
    }

    editSelectedEvent(eventId) {
        const event = this.gameState.db.getEventById(eventId);
        if (!event) return;
        
        // Switch to create tab and populate with event data
        this.switchEditorTab(this.editorWindows.event, 'create');
        
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventDuration').value = event.duration / 60;
        document.getElementById('eventInterval').value = event.interval / 60;
        document.getElementById('eventMonster').value = event.monsterId;
        document.getElementById('eventCount').value = event.count;
        
        this.uiManager.showNotification(`Editing event: ${event.name}`);
    }

    startSelectedEvent(eventId) {
        const event = this.gameState.db.getEventById(eventId);
        if (!event) return;
        
        const monster = this.gameState.db.getMonsterById(event.monsterId);
        if (!monster) {
            this.uiManager.showNotification('Monster not found');
            return;
        }
        
        // Spawn event monsters
        const player = this.gameState.player;
        for (let i = 0; i < event.count; i++) {
            const angle = (i / event.count) * Math.PI * 2;
            const distance = 300;
            const x = player.position.x + Math.cos(angle) * distance;
            const y = player.position.y + Math.sin(angle) * distance;
            this.gameState.spawnMonster(monster, x, y);
        }
        
        this.uiManager.showNotification(`Event "${event.name}" started!`);
    }

    openEditor(editorType) {
        const window = this.editorWindows[editorType];
        if (!window) return;
        window.classList.add('active');
        this.bringToFront(window);
    }

    closeEditor(window) {
        if (window) window.classList.remove('active');
    }

    saveWindowPositions() {
        const positions = {};
        Object.entries(this.editorWindows).forEach(([type, window]) => {
            if (window) {
                positions[type] = {
                    left: window.offsetLeft,
                    top: window.offsetTop,
                    width: window.offsetWidth,
                    height: window.offsetHeight
                };
            }
        });
        localStorage.setItem('muOnlineEditorPositions', JSON.stringify(positions));
    }

    loadWindowPositions() {
        const saved = localStorage.getItem('muOnlineEditorPositions');
        if (saved) {
            try {
                const positions = JSON.parse(saved);
                Object.entries(positions).forEach(([type, pos]) => {
                    const window = this.editorWindows[type];
                    if (window) {
                        window.style.left = `${pos.left}px`;
                        window.style.top = `${pos.top}px`;
                        if (pos.width) window.style.width = `${pos.width}px`;
                        if (pos.height) window.style.height = `${pos.height}px`;
                    }
                });
            } catch (e) {
                console.error('Error loading window positions:', e);
            }
        }
    }
}