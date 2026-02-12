// Feedback form handler with localStorage
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('feedbackForm');
  const feedbackList = document.getElementById('feedbackList');
  const successMessage = document.getElementById('successMessage');

  // Load and display existing feedback
  function loadFeedback() {
    const feedbackItems = JSON.parse(localStorage.getItem('feedbackItems')) || [];
    
    if (feedbackItems.length === 0) {
      feedbackList.innerHTML = '<p class="empty-state">No feedback yet. Be the first to share!</p>';
      return;
    }

    feedbackList.innerHTML = '';
    
    // Display feedback in reverse chronological order (newest first)
    feedbackItems.reverse().forEach(function(item, index) {
      const feedbackElement = createFeedbackElement(item, feedbackItems.length - 1 - index);
      feedbackList.appendChild(feedbackElement);
    });
  }

  // Create feedback element
  function createFeedbackElement(item, index) {
    const div = document.createElement('div');
    div.className = 'feedback-item';
    
    const date = new Date(item.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const name = item.name ? item.name : 'Anonymous';
    
    div.innerHTML = `
      <div class="feedback-item-header">
        <div>
          <span class="feedback-type ${item.type.toLowerCase().replace(/\s+/g, '-')}">${item.type}</span>
          <span class="feedback-name">${name}</span>
        </div>
        <div class="feedback-actions">
          <span class="feedback-date">${date}</span>
          <button class="delete-btn" aria-label="Delete feedback" title="Delete this feedback">×</button>
        </div>
      </div>
      <p class="feedback-item-message">${escapeHtml(item.message)}</p>
    `;

    // Add delete event listener
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete this feedback?')) {
        deleteFeedback(index);
      }
    });
    
    return div;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Delete feedback by index
  function deleteFeedback(index) {
    const feedbackItems = JSON.parse(localStorage.getItem('feedbackItems')) || [];
    feedbackItems.splice(index, 1);
    localStorage.setItem('feedbackItems', JSON.stringify(feedbackItems));
    loadFeedback();
  }

  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Get form values
    const type = document.querySelector('input[name="feedback-type"]:checked').value;
    const message = document.getElementById('feedback-message').value;
    const name = document.getElementById('feedback-name').value;

    // Create feedback object
    const feedback = {
      type: type,
      message: message,
      name: name,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const feedbackItems = JSON.parse(localStorage.getItem('feedbackItems')) || [];
    feedbackItems.push(feedback);
    localStorage.setItem('feedbackItems', JSON.stringify(feedbackItems));

    // Clear form
    form.reset();

    // Show success message
    successMessage.style.display = 'block';
    setTimeout(function() {
      successMessage.style.display = 'none';
    }, 3000);

    // Reload feedback display
    loadFeedback();
  });

  // Initial load
  loadFeedback();
});
