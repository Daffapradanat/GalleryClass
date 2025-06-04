const welcomeWords = ['welcome', 'to', 'Gallery of Memory', 'PPLG 2'];
let currentWordIndex = 0;

window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.splash').style.display = 'none';
        startWelcomeAnimation();
    }, 3000);
});

function startWelcomeAnimation() {
    const welcomeScreen = document.querySelector('.welcome-screen');
    const welcomeText = document.querySelector('.welcome-text');
    
    welcomeScreen.classList.add('active');
    
    function showNextWord() {
        if (currentWordIndex < welcomeWords.length) {
            const word = welcomeWords[currentWordIndex];
            
            welcomeText.textContent = word;
            welcomeText.classList.remove('hide');
            welcomeText.classList.add('show');
            
            setTimeout(() => {
                welcomeText.classList.remove('show');
                welcomeText.classList.add('hide');
                
                setTimeout(() => {
                    currentWordIndex++;
                    if (currentWordIndex < welcomeWords.length) {
                        showNextWord();
                    } else {
                        setTimeout(() => {
                            welcomeScreen.style.display = 'none';
                            document.querySelector('.container').classList.add('show');
                        }, 500);
                    }
                }, 1000);
            }, 1500);
        }
    }
    
    showNextWord();
}

function getImagesPerBatch() {
    const width = window.innerWidth;
    if (width <= 480) return 12;
    if (width <= 768) return 16;
    if (width <= 1200) return 20;
    return 24; 
}

let currentBatch = 0;
let allUrls = [];
let isLoading = false;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const realSrc = img.dataset.src;
            
            if (realSrc && !img.src.includes('drive.google.com/uc')) {
                img.style.filter = 'blur(5px)';
                
                const tempImg = new Image();
                tempImg.onload = () => {
                    img.src = realSrc;
                    img.style.filter = 'none';
                    img.style.transition = 'filter 0.3s ease';
                    
                    setTimeout(() => calculateMasonryLayout(img), 50);
                };
                tempImg.onerror = () => {
                    const fileId = realSrc.match(/id=(.+?)(&|$)/)?.[1];
                    if (fileId) {
                        const size = getOptimalImageSize();
                        img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
                        
                        setTimeout(() => calculateMasonryLayout(img), 100);
                    }
                    img.style.filter = 'none';
                };
                tempImg.src = realSrc;
                
                observer.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '100px'
});

function getOptimalImageSize() {
    const width = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;
    
    if (width <= 480) {
        return dpr > 1 ? 's800' : 's600';
    } else if (width <= 768) {
        return dpr > 1 ? 's1200' : 's800';
    } else if (width <= 1200) {
        return dpr > 1 ? 's1600' : 's1200';
    } else {
        return dpr > 1 ? 's2048' : 's1600';
    }
}

function calculateMasonryLayout(img) {
    const item = img.parentElement;
    const gallery = document.getElementById('gallery');
    
    if (img.complete && img.naturalHeight !== 0) {
        const computedStyle = window.getComputedStyle(gallery);
        const rowHeight = parseInt(computedStyle.getPropertyValue('grid-auto-rows'));
        const rowGap = parseInt(computedStyle.getPropertyValue('gap'));
        
        const itemHeight = img.offsetHeight;
        const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap));
        
        item.style.gridRowEnd = `span ${Math.max(1, rowSpan)}`;
    } else {
        setTimeout(() => calculateMasonryLayout(img), 100);
    }
}

function recalculateAllLayouts() {
    const items = document.querySelectorAll('.gallery-item img');
    items.forEach((img, index) => {
        if (img.complete && img.naturalHeight !== 0) {
            setTimeout(() => calculateMasonryLayout(img), index * 5);
        }
    });
}

function createImagePlaceholder(index) {
    const col = document.createElement('div');
    col.className = 'gallery-item';
    
    col.style.animationDelay = `${(index % getImagesPerBatch()) * 0.05}s`;
    
    const img = document.createElement('img');
    img.alt = `foto${index + 1}`;
    img.loading = "lazy";
    
    const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23333;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23555;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23888' text-anchor='middle' dy='.3em'%3ELoading...%3C/text%3E%3C/svg%3E`;
    
    img.src = placeholderSvg;
    
    col.appendChild(img);
    return { col, img };
}

function loadBatch() {
    const IMAGES_PER_BATCH = getImagesPerBatch();
    
    if (isLoading || currentBatch * IMAGES_PER_BATCH >= allUrls.length) {
        return;
    }
    
    isLoading = true;
    const gallery = document.getElementById('gallery');
    const startIndex = currentBatch * IMAGES_PER_BATCH;
    const endIndex = Math.min(startIndex + IMAGES_PER_BATCH, allUrls.length);
    
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
        const link = allUrls[i];
        const idMatch = link.match(/\/d\/(.+?)\//);
        if (!idMatch) continue;
        
        const fileId = idMatch[1];
        const baseUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        
        const { col, img } = createImagePlaceholder(i);
        
        img.dataset.src = baseUrl;
        
        img.onerror = function() {
            const size = getOptimalImageSize();
            this.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
        };
        
        observer.observe(img);
        
        fragment.appendChild(col);
    }
    
    gallery.appendChild(fragment);
    
    currentBatch++;
    isLoading = false;
    
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    const IMAGES_PER_BATCH = getImagesPerBatch();
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (currentBatch * IMAGES_PER_BATCH >= allUrls.length) {
        if (loadMoreBtn) {
            loadMoreBtn.remove();
        }
        return;
    }
    
    if (!loadMoreBtn) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Muat Lebih Banyak';
        loadMoreBtn.onclick = loadBatch;
        
        const gallery = document.getElementById('gallery');
        gallery.parentNode.appendChild(loadMoreBtn);
    }
    
    const remaining = allUrls.length - (currentBatch * IMAGES_PER_BATCH);
    const nextBatch = Math.min(IMAGES_PER_BATCH, remaining);
    loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Muat ${nextBatch} Foto Lagi`;
}

function enableInfiniteScroll() {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
                loadBatch();
            }
        }, 100);
    });
}

fetch('data.json')
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        allUrls = data.urls;
        
        if (!Array.isArray(allUrls) || allUrls.length === 0) {
            throw new Error('No URLs found in data.json');
        }
        
        console.log(`Loaded ${allUrls.length} images from data.json`);
        
        for (let i = allUrls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allUrls[i], allUrls[j]] = [allUrls[j], allUrls[i]];
        }
        console.log('Images shuffled for random display');
        
        loadBatch();
        
        // enableInfiniteScroll();
    })
    .catch(err => {
        console.error("Gagal memuat data:", err);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div style="
                grid-column: 1 / -1;
                text-align: center; 
                padding: 2rem; 
                color: #888;
                font-size: 1.2rem;
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                Gagal memuat galeri. Pastikan file data.json tersedia dan berisi URL yang valid.
                <br><br>
                <button onclick="location.reload()" style="
                    background: #333; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                ">
                    <i class="fas fa-refresh"></i> Refresh Halaman
                </button>
            </div>
        `;
    });

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const images = document.querySelectorAll('.gallery-item img[data-src]');
        const newSize = getOptimalImageSize();
        
        images.forEach(img => {
            if (img.src.includes('thumbnail')) {
                const fileId = img.dataset.src.match(/id=(.+?)(&|$)/)?.[1];
                if (fileId) {
                    img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=${newSize}`;
                }
            }
        });
        
        setTimeout(() => {
            recalculateAllLayouts();
        }, 200);
    }, 300);
});

function scrollToTop() {
    window.scrollTo({
    top: 0,
    behavior: 'smooth'
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar a, .mobile-nav a');
    
    navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        navLinks.forEach(l => l.classList.remove('active'));
        
        this.classList.add('active');
        
        const icon = this.querySelector('i').className;
        navLinks.forEach(l => {
        if (l.querySelector('i').className === icon) {
            l.classList.add('active');
        }
        });
    });
    });
});

startWelcomeSequence();

window.addEventListener('scroll', function() {
    const floatingBtn = document.querySelector('.floating-hover-btn');
    if (window.scrollY > 300) {
    floatingBtn.style.opacity = '1';
    } else {
    floatingBtn.style.opacity = '0.7';
    }
});

const style = document.createElement('style');
style.textContent = `
    .gallery-item {
        opacity: 0;
        transform: translateY(20px);
        animation: slideInFromTop 0.6s ease forwards;
        will-change: transform, opacity;
    }
    
    @keyframes slideInFromTop {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    html {
        scroll-behavior: smooth;
    }
    
    .gallery-item img[data-src] {
        background: linear-gradient(45deg, #333, #555);
        min-height: 150px;
    }
    
    .gallery-item {
        overflow: hidden;
        display: flex;
        align-items: start;
        will-change: grid-row-end;
    }
    
    .gallery-item img {
        width: 100%;
        height: auto;
        object-fit: cover;
        will-change: transform, filter;
    }
    
    #gallery {
        align-content: start;
    }
    
    @media (max-width: 768px) {
        .gallery-item img {
            image-rendering: auto;
            will-change: auto;
        }
        
        .gallery-item:hover img {
            transform: none;
            filter: none;
        }
    }
    
    * {
        max-width: 100%;
    }
    
    .gallery-item img {
        max-width: 100% !important;
        height: auto !important;
    }
`;
document.head.appendChild(style);