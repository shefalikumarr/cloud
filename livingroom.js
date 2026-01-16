// Guided Tour Modal Logic
document.addEventListener('DOMContentLoaded', function() {
  const tourBtn = document.getElementById('guided-tour-btn');
  const modal = document.getElementById('guided-tour-modal');
  const fade = document.getElementById('guided-tour-fade');
  const options = document.getElementById('guided-tour-options');
  const slideshow = document.getElementById('guided-tour-slideshow');
  const img = document.getElementById('guided-tour-image');
  const prevBtn = document.getElementById('guided-tour-prev');
  const nextBtn = document.getElementById('guided-tour-next');
  const exitBtn = document.getElementById('guided-tour-exit');

  // Placeholder images (use your own URLs or local images)
  const images = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80'
  ];
  let currentIdx = 0;
  let userChoice = null;

  function showModal() {
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('fade-in');
    }, 10);
  }

  function hideModal() {
    modal.classList.remove('fade-in', 'fade-to-black');
    setTimeout(() => {
      modal.style.display = 'none';
      options.style.display = '';
      slideshow.style.display = 'none';
      img.src = '';
      img.classList.remove('loaded');
      currentIdx = 0;
      userChoice = null;
    }, 700);
  }

  function fadeToBlack(cb) {
    modal.classList.remove('fade-in');
    modal.classList.add('fade-to-black');
    setTimeout(() => {
      if (cb) cb();
    }, 800);
  }

  function showSlideshow() {
    options.style.display = 'none';
    slideshow.style.display = 'flex';
    showImage(0);
    modal.classList.remove('fade-to-black');
    modal.classList.add('fade-in');
  }

  function showImage(idx) {
    currentIdx = idx;
    img.classList.remove('loaded');
    img.src = images[idx];
  }

  img.onload = function() {
    img.classList.add('loaded');
  };

  prevBtn.onclick = function(e) {
    e.stopPropagation();
    let idx = (currentIdx - 1 + images.length) % images.length;
    showImage(idx);
  };
  nextBtn.onclick = function(e) {
    e.stopPropagation();
    let idx = (currentIdx + 1) % images.length;
    showImage(idx);
  };
  exitBtn.onclick = function(e) {
    e.stopPropagation();
    hideModal();
  };

  // Option selection
  options.addEventListener('click', function(e) {
    if (e.target.classList.contains('guided-tour-option')) {
      userChoice = e.target.getAttribute('data-choice');
      fadeToBlack(() => {
        showSlideshow();
      });
    }
  });

  // Open modal on button click
  tourBtn.addEventListener('click', function(e) {
    e.preventDefault();
    showModal();
  });

  // Optional: close modal on outside click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      hideModal();
    }
  });
});
