function includeHTML(id, file) {
    fetch(file)
        .then(res => res.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("sidebar-include", "sidebar.html");
includeHTML("header-include", "header.html");

window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.splash').style.display = 'none';
    }, 3000);
});

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
                        img.src = `https://drive.google.com/thumbnail?id=${fileId}`;
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
        const imgUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        // const imgUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
        
        const { col, img } = createImagePlaceholder(i);
        
        img.dataset.src = imgUrl;
        
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
    .then(res => res.json())
    .then(data => {
        allUrls = data.urls;
        
        for (let i = allUrls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allUrls[i], allUrls[j]] = [allUrls[j], allUrls[i]];
        }
        
        loadBatch();
        
        // enableInfiniteScroll();
    })
    .catch(err => {
        console.error("Gagal memuat data:", err);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;">Gagal memuat galeri. Silakan refresh halaman.</div>';
    });

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}