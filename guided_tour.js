// Guided Tour Modal Logic

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('guided-tour-modal');
  const fade = document.getElementById('guided-tour-fade');
  const options = document.getElementById('guided-tour-options');
  const slideshow = document.getElementById('guided-tour-slideshow');
  const img = document.getElementById('guided-tour-image');
  const prevBtn = document.getElementById('guided-tour-prev');
  const nextBtn = document.getElementById('guided-tour-next');
  const exitBtn = document.getElementById('guided-tour-exit');
  const slideCounter = document.getElementById('guided-tour-slide-counter');



  // Map user choices to tag names
  const tagByChoice = {
    bit: 'short_tour',
    little: 'medium_tour',
    all: 'long_tour'
  };
  let images = [];
  let currentIdx = 0;
  let userChoice = null;

  function fadeToBlack(cb) {
    modal.classList.add('tour-black');
    setTimeout(() => {
      if (cb) cb();
    }, 700);
  }

  function showSlideshow() {
    options.style.display = 'none';
    slideshow.style.display = 'flex';
    if (images.length > 0) {
      showImage(0);
    }
  }

  function showImage(idx, noFade = false) {
    currentIdx = idx;
    updateSlideCounter();
    if (noFade) {
      img.classList.remove('loaded');
      // Temporarily disable transition for instant switch
      img.style.transition = 'none';
      if (images[idx]) {
        img.src = images[idx].url || images[idx];
        img.alt = images[idx].alt || '';
      }
      // Force reflow to apply the style
      void img.offsetWidth;
      img.classList.add('loaded');
      // Restore transition after a tick
      setTimeout(() => { img.style.transition = ''; }, 0);
    } else {
      img.classList.remove('loaded');
      if (images[idx]) {
        img.src = images[idx].url || images[idx];
        img.alt = images[idx].alt || '';
      }
    }
  }

  function updateSlideCounter() {
    if (!slideCounter) return;
    if (images.length > 0) {
      slideCounter.textContent = `${currentIdx + 1} / ${images.length}`;
    } else {
      slideCounter.textContent = '';
    }
  }

  img.onload = function() {
    img.classList.add('loaded');
  };

  prevBtn.onclick = function(e) {
    e.stopPropagation();
    let idx = (currentIdx - 1 + images.length) % images.length;
    showImage(idx, true);
  };
  nextBtn.onclick = function(e) {
    e.stopPropagation();
    let idx = (currentIdx + 1) % images.length;
    showImage(idx, true);
  };
  exitBtn.onclick = function(e) {
    e.stopPropagation();
    window.location.href = 'livingroom.html';
  };

  // Option selection
  options.addEventListener('click', async function(e) {
    if (e.target.classList.contains('guided-tour-option')) {
      userChoice = e.target.getAttribute('data-choice');
      const tag = tagByChoice[userChoice];
      if (!tag) return;
      // Show loading state
      options.style.opacity = 0.5;
      options.style.pointerEvents = 'none';
      try {
        const res = await fetch(`/api/guided-tour-images?tag=${encodeURIComponent(tag)}`);
        if (!res.ok) throw new Error('Failed to fetch images: ' + res.status);
        images = await res.json();
        if (!Array.isArray(images) || images.length === 0) {
          alert('No images found for this tour.');
        }
      } catch (err) {
        images = [];
        console.error('Error fetching guided tour images:', err);
        alert('Could not load images for this tour. See console for details.');
      } finally {
        options.style.opacity = '';
        options.style.pointerEvents = '';
      }
      fadeToBlack(() => {
        showSlideshow();
      });
    }
  });
});
