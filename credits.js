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

function scrollToTop() {
    window.scrollTo({
    top: 0,
    behavior: 'smooth'
    });
}

window.addEventListener('scroll', function() {
    const btn = document.querySelector('.floating-hover-btn');
    if (window.scrollY > 300) {
    btn.style.opacity = '1';
    btn.style.visibility = 'visible';
    } else {
    btn.style.opacity = '0';
    btn.style.visibility = 'hidden';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.credit-card');
    cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    });

    const techItems = document.querySelectorAll('.tech-item');
    techItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.05}s`;
    item.style.animation = 'fadeInUp 0.6s ease-out forwards';
    });
});