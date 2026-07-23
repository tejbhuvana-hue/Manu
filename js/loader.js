/*
  Retro Love Story - Transition Loader
  Handles the fullscreen loading overlays that trigger on startup and between section changes,
  animates a loading progress bar from 0% to 100%, randomizes romantic notes, and spawns hearts.
*/

const TransitionLoader = {
  overlay: null,
  quoteEl: null,
  particleContainer: null,
  progressFill: null,
  progressPercentage: null,
  quotesList: [],
  currentQuoteIndex: 0,
  isTransitioning: false,

  init() {
    this.overlay = document.getElementById('loader-overlay');
    this.quoteEl = document.getElementById('loader-quote');
    this.particleContainer = this.overlay ? this.overlay.querySelector('.loader-particles') : null;
    this.progressFill = document.getElementById('loader-progress-fill');
    this.progressPercentage = document.getElementById('loader-progress-percentage');
    
    // Load quotes list from global configurations, fallback if missing
    if (window.SITE_CONFIG && window.SITE_CONFIG.loadingNotes) {
      this.quotesList = [...window.SITE_CONFIG.loadingNotes];
    } else {
      this.quotesList = [
        "Loading Memories...",
        "Preparing Something Special...",
        "Opening My Heart..."
      ];
    }
    
    // Shuffle the quotes initially
    this.quotesList.sort(() => Math.random() - 0.5);

    // Initial Welcome Quote
    if (this.quoteEl) {
      this.quoteEl.textContent = "Opening My Heart...";
    }

    // Spawn hearts on first load
    this.spawnLoaderHearts();

    // Trigger Initial Startup Load (completed BEFORE 3 seconds, e.g. 2.0 seconds)
    this.animateProgressBar(1800, () => {
      // Fade out loading screen to reveal Welcome screen (Section 1)
      gsap.to(this.overlay, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          this.overlay.style.display = 'none';
        }
      });
    });
  },

  // Pick the next quote from the shuffled list
  getNextQuote() {
    if (this.quotesList.length === 0) return "Loading...";
    const quote = this.quotesList[this.currentQuoteIndex];
    this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotesList.length;
    return quote;
  },

  // Spawns small floating CSS hearts in loader screen
  spawnLoaderHearts() {
    if (!this.particleContainer) return;
    this.particleContainer.innerHTML = '';
    
    const colors = ['#c1121f', '#ff4d6d', '#ff85a2'];
    
    for (let i = 0; i < 20; i++) {
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.position = 'absolute';
      heart.style.fontSize = `${10 + Math.random() * 18}px`;
      heart.style.color = colors[Math.floor(Math.random() * colors.length)];
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.top = `${100 + Math.random() * 20}vh`;
      heart.style.opacity = `${0.3 + Math.random() * 0.7}`;
      heart.style.zIndex = '1001';
      heart.style.pointerEvents = 'none';
      
      this.particleContainer.appendChild(heart);
      
      // GSAP float heart upward
      gsap.to(heart, {
        y: -window.innerHeight - 150,
        x: (Math.random() - 0.5) * 150,
        rotation: (Math.random() - 0.5) * 180,
        duration: 1.5 + Math.random() * 1.5,
        ease: 'power1.out',
        delay: Math.random() * 0.8
      });
    }
  },

  /**
   * Animates the progress bar and percentage label smoothly
   * @param {Number} durationMs - Animation duration
   * @param {Function} callback - Triggered when progress reaches 100%
   */
  animateProgressBar(durationMs, callback) {
    if (!this.progressFill || !this.progressPercentage) {
      if (callback) callback();
      return;
    }

    // Reset initial states
    this.progressFill.style.width = '0%';
    this.progressPercentage.textContent = '0%';

    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      const percent = Math.floor(progress * 100);
      this.progressFill.style.width = `${percent}%`;
      this.progressPercentage.textContent = `${percent}%`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (callback) callback();
      }
    };

    requestAnimationFrame(update);
  },

  /**
   * Triggers transition loading overlay before changing pages
   * @param {Function} transitionCallback - Run right in the middle to toggle section visibility
   * @param {String} customQuote - Optional specific note to show
   * @param {Number} durationMs - How long the loader stays visible (default: 2400ms)
   */
  transitionTo(transitionCallback, customQuote = null, durationMs = 1200) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (!this.overlay) {
      // Fallback if loader overlay not rendered
      transitionCallback();
      this.isTransitioning = false;
      return;
    }

    // Set romantic note
    const noteText = customQuote || this.getNextQuote();
    if (this.quoteEl) {
      this.quoteEl.textContent = noteText;
    }

    // Reset overlay styles
    this.overlay.style.display = 'flex';
    this.overlay.style.opacity = '1';
    
    // Spawn hearts
    this.spawnLoaderHearts();

    // Reset progress bar elements
    if (this.progressFill) this.progressFill.style.width = '0%';
    if (this.progressPercentage) this.progressPercentage.textContent = '0%';

    // Fade music slightly if playing (premium audio touch)
    if (window.AudioController && window.AudioController.isPlaying) {
      window.AudioController.setVolume(window.AudioController.targetVolume * 0.4);
    }

    // Run progress bar animation
    // Leave a small buffer at the end so it sits at 100% briefly before fading out
    const bufferTime = Math.min(400, Math.floor(durationMs * 0.15));
    const activeAnimationTime = durationMs - bufferTime;
    this.animateProgressBar(activeAnimationTime, () => {
      // Done animating
    });

    // Phase 1: Wait for loader to fully show and progress a bit, then swap sections in background
    setTimeout(() => {
      if (transitionCallback) {
        transitionCallback();
      }
    }, Math.floor(durationMs * 0.3)); // Swap around 30% mark of the total transition time

    // Phase 2: Complete the loader duration, then fade out loader
    setTimeout(() => {
      // Restore music volume
      if (window.AudioController && window.AudioController.isPlaying) {
        window.AudioController.setVolume(window.AudioController.targetVolume);
      }

      // GSAP fade out overlay
      gsap.to(this.overlay, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          this.overlay.style.display = 'none';
          this.isTransitioning = false;
        }
      });
    }, durationMs);
  }
};

// Expose TransitionLoader globally
window.TransitionLoader = TransitionLoader;
