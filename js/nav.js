// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
  // Highlight active page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.site-nav .nav-link');
  
  navLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Back button functionality
  const backBtn = document.getElementById('backBtn');
  
  // Only show back button if not on home page and there's history
  if (window.history.length > 1 && currentPage !== 'index.html') {
    backBtn.style.display = 'inline-block';
  }
  
  backBtn.addEventListener('click', function() {
    window.history.back();
  });
});
