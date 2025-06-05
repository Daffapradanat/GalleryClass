let settingsData = {
    gallery: {
        totalImages: 0,
        loadedImages: 0,
        dataTransfer: 0,
        loadTime: 0
    },
    server: {
        ping: 0,
        serverLoad: 0,
        connectionSpeed: 0,
        memoryUsage: 0
    }
};

let performanceData = {
    imageLoadStartTime: 0,
    imageLoadEndTime: 0,
    totalImageSize: 0,
    loadedImageCount: 0,
    networkStartTime: 0,
    initialMemory: 0
};

const domCache = {
    modal: null,
    elements: {}
};

function initializeSettingsCache() {
    if (!domCache.modal) {
        domCache.modal = document.getElementById('settingsModal');
        
        const elementIds = [
            'totalImages', 'loadedImages', 'dataTransfer', 'loadTime',
            'pingValue', 'pingBar', 'pingStatus', 'pingStatusText',
            'serverLoad', 'loadBar', 'loadStatus', 'loadStatusText',
            'connectionSpeed', 'speedBar', 'speedStatus', 'speedStatusText',
            'memoryUsage', 'memoryBar', 'memoryStatus', 'memoryStatusText'
        ];
        
        elementIds.forEach(id => {
            domCache.elements[id] = document.getElementById(id);
        });
    }
}

function openSettingsModal() {
    initializeSettingsCache();
    
    domCache.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        loadRealSettingsData();
    });
}

function closeSettingsModal() {
    if (domCache.modal) {
        domCache.modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function loadRealSettingsData() {
    requestAnimationFrame(() => {
        calculateGalleryStats();
        measureServerPerformance();
    });
}

function getTotalImagesFromJSON() {
    if (typeof allUrls !== 'undefined' && Array.isArray(allUrls)) {
        return allUrls.length;
    }
    
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            if (data.urls && Array.isArray(data.urls)) {
                settingsData.gallery.totalImages = data.urls.length;
                updateGalleryDisplay();
            }
        })
        .catch(err => {
            console.warn('Could not fetch total images:', err);
            settingsData.gallery.totalImages = 0;
        });
    
    return 0;
}

function getCurrentlyLoadedImages() {
    const loadedImages = document.querySelectorAll('.gallery-item img[src]:not([src*="data:image/svg"]');
    return loadedImages.length;
}

function calculateDataTransferPerImage() {
    const loadedImages = document.querySelectorAll('.gallery-item img[src]:not([src*="data:image/svg"])');
    let totalEstimatedSize = 0;
    
    loadedImages.forEach(img => {
        const width = img.naturalWidth || img.width || 400;
        const height = img.naturalHeight || img.height || 300;
        
        const estimatedSize = (width * height * 3 * 0.15) / (1024 * 1024);
        totalEstimatedSize += estimatedSize;
    });
    
    return totalEstimatedSize;
}

function measureImageLoadTime() {
    return performanceData.imageLoadEndTime - performanceData.imageLoadStartTime;
}

async function measurePingToGoogleDrive() {
    const startTime = performance.now();
    
    try {
        const response = await fetch('https://drive.google.com/favicon.ico', {
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors'
        });
        
        const endTime = performance.now();
        return Math.round(endTime - startTime);
    } catch (error) {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            return Math.round(navigation.responseStart - navigation.requestStart);
        }
        return 50;
    }
}

function calculateServerLoad() {
    const totalImages = getTotalImagesFromJSON();
    const loadedImages = getCurrentlyLoadedImages();
    const loadPercentage = totalImages > 0 ? (loadedImages / totalImages) * 100 : 0;
    
    // Factor in:
    // - Number of loaded images
    // - DOM complexity
    // - Active requests
    const domElements = document.querySelectorAll('*').length;
    const activeRequests = performance.getEntriesByType('resource').filter(
        entry => entry.responseEnd === 0
    ).length;
    
    let serverLoad = 0;
    serverLoad += Math.min(loadPercentage * 0.4, 40);
    serverLoad += Math.min((domElements / 100) * 0.3, 30);
    serverLoad += Math.min(activeRequests * 5, 30);
    
    return Math.min(Math.round(serverLoad), 100);
}

async function estimateConnectionSpeed() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.downlink) {
            return connection.downlink;
        }
    }
    
    try {
        const startTime = performance.now();
        const response = await fetch('https://drive.google.com/favicon.ico?' + Date.now(), {
            cache: 'no-cache'
        });
        const endTime = performance.now();
        
        const duration = (endTime - startTime) / 1000;
        const bytes = parseInt(response.headers.get('content-length')) || 1024;
        const speed = (bytes * 8) / (duration * 1024 * 1024);
        
        return Math.max(speed, 1);
    } catch (error) {
        return 10;
    }
}

function calculateMemoryUsage() {
    if ('memory' in performance) {
        const memory = performance.memory;
        return Math.round(memory.usedJSHeapSize / (1024 * 1024));
    }
    
    const loadedImages = getCurrentlyLoadedImages();
    const domElements = document.querySelectorAll('*').length;
    
    // Rough estimation:
    // - Each image: ~2-5MB in memory
    // - Each DOM element: ~1KB
    // - Base website overhead: ~10MB
    const estimatedMemory = (loadedImages * 3.5) + (domElements * 0.001) + 10;
    
    return Math.round(estimatedMemory);
}

function calculateGalleryStats() {
    settingsData.gallery = {
        totalImages: getTotalImagesFromJSON(),
        loadedImages: getCurrentlyLoadedImages(),
        dataTransfer: parseFloat(calculateDataTransferPerImage().toFixed(1)),
        loadTime: parseFloat((measureImageLoadTime() / 1000).toFixed(1)) || 0
    };

    updateGalleryDisplay();
}

async function measureServerPerformance() {
    try {
        const [ping, connectionSpeed] = await Promise.all([
            measurePingToGoogleDrive(),
            estimateConnectionSpeed()
        ]);

        settingsData.server = {
            ping: ping,
            serverLoad: calculateServerLoad(),
            connectionSpeed: parseFloat(connectionSpeed.toFixed(1)),
            memoryUsage: calculateMemoryUsage()
        };

        updateServerDisplay();
    } catch (error) {
        console.warn('Error measuring server performance:', error);
        settingsData.server = {
            ping: 50,
            serverLoad: calculateServerLoad(),
            connectionSpeed: 10.0,
            memoryUsage: calculateMemoryUsage()
        };
        updateServerDisplay();
    }
}

function updateGalleryDisplay() {
    const data = settingsData.gallery;
    
    if (domCache.elements.totalImages) {
        domCache.elements.totalImages.textContent = data.totalImages.toLocaleString();
        domCache.elements.loadedImages.textContent = data.loadedImages.toLocaleString();
        domCache.elements.dataTransfer.textContent = data.dataTransfer + ' MB';
        domCache.elements.loadTime.textContent = data.loadTime + 's';
    }
}

function updateServerDisplay() {
    const data = settingsData.server;
    
    requestAnimationFrame(() => {
        if (domCache.elements.pingValue) {
            domCache.elements.pingValue.textContent = data.ping + 'ms';
            updatePerformanceBar('pingBar', data.ping, 500, true);
            updateStatusIndicator('ping', data.ping, [100, 200], true);
            
            domCache.elements.serverLoad.textContent = data.serverLoad + '%';
            updatePerformanceBar('loadBar', data.serverLoad, 100, true);
            updateStatusIndicator('load', data.serverLoad, [30, 70], true);
            
            domCache.elements.connectionSpeed.textContent = data.connectionSpeed + ' Mbps';
            updatePerformanceBar('speedBar', data.connectionSpeed, 100, false);
            updateStatusIndicator('speed', data.connectionSpeed, [10, 25], false);
            
            domCache.elements.memoryUsage.textContent = data.memoryUsage + ' MB';
            updatePerformanceBar('memoryBar', data.memoryUsage, 1024, true);
            updateStatusIndicator('memory', data.memoryUsage, [256, 512], true);
        }
    });
}

function updatePerformanceBar(barId, value, max, lowerIsBetter) {
    const bar = domCache.elements[barId];
    if (!bar) return;
    
    const percentage = Math.min((value / max) * 100, 100);
    
    bar.style.width = percentage + '%';
    
    bar.className = 'performance-fill ';
    if (lowerIsBetter) {
        if (percentage <= 25) bar.className += 'good-performance';
        else if (percentage <= 50) bar.className += 'medium-performance';
        else bar.className += 'poor-performance';
    } else {
        if (percentage >= 75) bar.className += 'good-performance';
        else if (percentage >= 50) bar.className += 'medium-performance';
        else bar.className += 'poor-performance';
    }
}

function updateStatusIndicator(type, value, thresholds, lowerIsBetter) {
    const statusElement = domCache.elements[type + 'Status'];
    const textElement = domCache.elements[type + 'StatusText'];
    
    if (!statusElement || !textElement) return;
    
    let status, text;
    if (lowerIsBetter) {
        if (value <= thresholds[0]) {
            status = 'good';
            text = type === 'ping' ? 'Excellent' : type === 'load' ? 'Low Load' : type === 'memory' ? 'Optimal' : 'Good';
        } else if (value <= thresholds[1]) {
            status = 'medium';
            text = type === 'ping' ? 'Good' : type === 'load' ? 'Medium Load' : type === 'memory' ? 'Moderate' : 'Medium';
        } else {
            status = 'poor';
            text = type === 'ping' ? 'Slow' : type === 'load' ? 'High Load' : type === 'memory' ? 'High Usage' : 'Poor';
        }
    } else {
        if (value >= thresholds[1]) {
            status = 'good';
            text = 'Fast';
        } else if (value >= thresholds[0]) {
            status = 'medium';
            text = 'Medium';
        } else {
            status = 'poor';
            text = 'Slow';
        }
    }
    
    statusElement.className = `status-indicator status-${status}`;
    textElement.textContent = text;
}

function refreshGalleryStats() {
    const gallerySection = document.querySelector('.settings-section');
    if (gallerySection) {
        gallerySection.classList.add('loading');
        
        setTimeout(() => {
            calculateGalleryStats();
            gallerySection.classList.remove('loading');
        }, 500);
    }
}

function refreshServerStats() {
    const serverSection = document.querySelectorAll('.settings-section')[1];
    if (serverSection) {
        serverSection.classList.add('loading');
        
        setTimeout(() => {
            measureServerPerformance();
            serverSection.classList.remove('loading');
        }, 1000);
    }
}

function initializePerformanceTracking() {
    const originalObserver = window.observer;
    if (originalObserver) {
        performanceData.imageLoadStartTime = performance.now();
        performanceData.networkStartTime = performance.now();
    }
    
    const images = document.querySelectorAll('.gallery-item img');
    let loadedCount = 0;
    
    images.forEach(img => {
        if (img.complete) {
            loadedCount++;
        } else {
            img.addEventListener('load', () => {
                loadedCount++;
                performanceData.loadedImageCount = loadedCount;
                performanceData.imageLoadEndTime = performance.now();
            });
        }
    });
}

window.onclick = function(event) {
    if (domCache.modal && event.target === domCache.modal) {
        closeSettingsModal();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSettingsModal();
    }
});

let updateInterval;

function startUpdateInterval() {
    if (updateInterval) return;
    
    updateInterval = setInterval(() => {
        if (domCache.modal && domCache.modal.classList.contains('show')) {
            requestAnimationFrame(() => {
                calculateGalleryStats();
                measureServerPerformance();
            });
        }
    }, 10000);
}

function stopUpdateInterval() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsCache();
    initializePerformanceTracking();
    startUpdateInterval();
    
    if ('memory' in performance) {
        performanceData.initialMemory = performance.memory.usedJSHeapSize;
    }
});

window.addEventListener('beforeunload', function() {
    stopUpdateInterval();
});

window.updateSettingsData = function() {
    if (domCache.modal && domCache.modal.classList.contains('show')) {
        loadRealSettingsData();
    }
};