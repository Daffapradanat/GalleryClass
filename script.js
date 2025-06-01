function includeHTML(id, file) {
    fetch(file)
        .then(res => res.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        })
        .catch(err => console.error(`Failed to load ${file}:`, err));
}

includeHTML("sidebar-include", "sidebar.html");
includeHTML("header-include", "header.html");

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

const IMAGES_PER_BATCH = 20;
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
                };
                tempImg.onerror = () => {
                    const fileId = realSrc.match(/id=(.+?)(&|$)/)?.[1];
                    if (fileId) {
                        const isMobile = window.innerWidth <= 768;
                        const size = isMobile ? 's800' : 's1600';
                        img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
                    }
                    img.style.filter = 'none';
                };
                tempImg.src = realSrc;
                
                observer.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '50px'
});

function createImagePlaceholder(index) {
    const col = document.createElement('div');
    col.className = 'gallery-item';
    
    col.style.animationDelay = `${(index % IMAGES_PER_BATCH) * 0.05}s`;
    
    const img = document.createElement('img');
    img.alt = `foto${index + 1}`;
    img.loading = "lazy";
    
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23333;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23555;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23888' text-anchor='middle' dy='.3em'%3ELoading...%3C/text%3E%3C/svg%3E";
    
    col.appendChild(img);
    return { col, img };
}

function loadBatch() {
    if (isLoading || currentBatch * IMAGES_PER_BATCH >= allUrls.length) {
        return;
    }
    
    isLoading = true;
    const gallery = document.getElementById('gallery');
    const startIndex = currentBatch * IMAGES_PER_BATCH;
    const endIndex = Math.min(startIndex + IMAGES_PER_BATCH, allUrls.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const link = allUrls[i];
        const idMatch = link.match(/\/d\/(.+?)\//);
        if (!idMatch) continue;
        
        const fileId = idMatch[1];
        
        const isMobile = window.innerWidth <= 768;
        const baseUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        
        const { col, img } = createImagePlaceholder(i);
        
        img.dataset.src = baseUrl;
        
        img.onerror = function() {
            const size = window.innerWidth <= 768 ? 's800' : 's1600';
            this.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
        };
        
        observer.observe(img);
        gallery.appendChild(col);
    }
    
    currentBatch++;
    isLoading = false;
    
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
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
    loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Muat ${Math.min(IMAGES_PER_BATCH, remaining)} Foto Lagi`;
}

function enableInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
            loadBatch();
        }
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
        
        // Validasi data
        if (!Array.isArray(allUrls) || allUrls.length === 0) {
            throw new Error('No URLs found in data.json');
        }
        
        console.log(`Loaded ${allUrls.length} images from data.json`);
        
        /*
        for (let i = allUrls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allUrls[i], allUrls[j]] = [allUrls[j], allUrls[i]];
        }
        */
        
        // Load first batch
        loadBatch();
        
        // enableInfiniteScroll();
    })
    .catch(err => {
        console.error("Gagal memuat data:", err);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div style="
                text-align: center; 
                padding: 2rem; 
                color: #888;
                grid-column: 1 / -1;
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const images = document.querySelectorAll('.gallery-item img[data-src]');
        images.forEach(img => {
            if (img.src.includes('thumbnail')) {
                const fileId = img.dataset.src.match(/id=(.+?)(&|$)/)?.[1];
                if (fileId) {
                    const isMobile = window.innerWidth <= 768;
                    const size = isMobile ? 's800' : 's1600';
                    img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
                }
            }
        });
    }, 300);
});

// Add CSS for gallery item animation
const style = document.createElement('style');
style.textContent = `
    .gallery-item {
        opacity: 0;
        transform: translateY(20px);
        animation: slideInFromTop 0.6s ease forwards;
    }
    
    @keyframes slideInFromTop {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);