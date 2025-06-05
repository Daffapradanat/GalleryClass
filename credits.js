const modal = document.getElementById('creditsModal');
const closeBtn = document.querySelector('.close');

function openCreditsModal() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCreditsModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

closeBtn.addEventListener('click', closeCreditsModal);

window.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeCreditsModal();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
        closeCreditsModal();
    }
});

window.openCreditsModal = openCreditsModal;