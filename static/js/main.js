// Main JavaScript file for FoodAdvisor

// Dropdown functionality
document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = this.closest('.dropdown');
        dropdown.querySelector('.dropdown-content').classList.toggle('show');
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', function() {
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
});

// Flash message auto-hide
document.querySelectorAll('.flash-message').forEach(msg => {
    setTimeout(() => {
        msg.style.opacity = '0';
        msg.style.transition = 'opacity 0.3s';
        setTimeout(() => msg.remove(), 300);
    }, 5000);
});
