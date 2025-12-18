// Utility functions
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function getRarityColor(rarity) {
    const colors = {
        common: '#ffffff',
        uncommon: '#448aff',
        rare: '#ffd740',
        epic: '#e94560',
        legendary: '#ff9800'
    };
    return colors[rarity] || colors.common;
}

export function getItemBackground(rarity) {
    const gradients = {
        common: 'linear-gradient(135deg, #ffffff, #cccccc)',
        uncommon: 'linear-gradient(135deg, #448aff, #2962ff)',
        rare: 'linear-gradient(135deg, #ffd740, #ffab00)',
        epic: 'linear-gradient(135deg, #e94560, #c2185b)',
        legendary: 'linear-gradient(135deg, #ff9800, #ff5722)'
    };
    return gradients[rarity] || gradients.common;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}