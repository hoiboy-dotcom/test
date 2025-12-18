export class DragDropManager {
    constructor() {
        this.draggedItem = null;
        this.dragSource = null;
        this.dragGhost = null;
        this.contextMenu = null;
    }

    initialize() {
        this.setupGlobalListeners();
        this.createContextMenu();
    }

    setupGlobalListeners() {
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleGlobalDrop(e);
        });

        document.addEventListener('dragend', () => {
            this.cleanupDrag();
        });
    }

    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        document.body.appendChild(this.contextMenu);

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(x, y, options) {
        this.contextMenu.innerHTML = '';
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = option.label;
            item.addEventListener('click', (e) => {
                option.action(e);
                this.hideContextMenu();
            });
            this.contextMenu.appendChild(item);
        });
        
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.display = 'block';
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }

    createDragGhost(item, x, y) {
        if (this.dragGhost) {
            document.body.removeChild(this.dragGhost);
        }

        this.dragGhost = document.createElement('div');
        this.dragGhost.className = 'drag-ghost';
        this.dragGhost.style.width = '40px';
        this.dragGhost.style.height = '40px';
        this.dragGhost.style.background = this.getItemColor(item.rarity);
        this.dragGhost.style.borderRadius = '5px';
        this.dragGhost.style.border = '2px solid #e94560';
        this.dragGhost.style.left = `${x - 20}px`;
        this.dragGhost.style.top = `${y - 20}px`;
        document.body.appendChild(this.dragGhost);
    }

    getItemColor(rarity) {
        const colors = {
            common: 'linear-gradient(135deg, #ffffff, #cccccc)',
            uncommon: 'linear-gradient(135deg, #448aff, #2962ff)',
            rare: 'linear-gradient(135deg, #ffd740, #ffab00)',
            epic: 'linear-gradient(135deg, #e94560, #c2185b)',
            legendary: 'linear-gradient(135deg, #ff9800, #ff5722)'
        };
        return colors[rarity] || colors.common;
    }

    cleanupDrag() {
        if (this.dragGhost) {
            document.body.removeChild(this.dragGhost);
            this.dragGhost = null;
        }
        
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        this.draggedItem = null;
        this.dragSource = null;
    }

    handleGlobalDrop(e) {
        // Handle drops outside of valid drop zones
        this.cleanupDrag();
    }
}