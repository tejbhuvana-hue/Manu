/*
  Retro Love Story - Core Website Engine
  Manages:
  - Audio Controller (Preloads music.mp3, falls back to custom Web Audio Ambient Synth if file is missing)
  - Procedural Rain Audio Synthesizer (Zero-file ambient rain noise)
  - Section state machine with page-turn and load transitions
  - Interactive components: Timeline, Memory Jar, Quiz, Secret Locker
  - Runaway YES button logic (Special Question)
  - Interactive Birthday Cake (Blow candle out)
  - Cinematic text typing finalizer
  - Desktop mouse coordinates & Mobile touch parallax listeners
*/

const AudioController = {
  audio: null,
  ctx: null,
  gainNode: null,
  synthInterval: null,
  rainNode: null,
  rainGain: null,
  isPlaying: false,
  isRainPlaying: false,
  targetVolume: 0.4,
  currentVolume: 0,
  useSynthFallback: false,

  init() {
    // 1. Set configured volume
    if (window.SITE_CONFIG && window.SITE_CONFIG.music) {
      this.targetVolume = window.SITE_CONFIG.music.volume;
      this.useSynthFallback = window.SITE_CONFIG.music.synthFallback;
    }

    // 2. Preload MP3
    this.audio = new Audio();
    this.audio.src = 'music/music.mp3';
    this.audio.loop = true;
    this.audio.volume = 0;
    
    // Set fallback on error
    this.audio.addEventListener('error', () => {
      console.warn("Background music file 'music/music.mp3' failed to load. Initializing Web Audio Synth fallback...");
      this.setupSynthFallback();
    });
  },

  // Setup synthesized chord progression fallback
  setupSynthFallback() {
    if (!this.useSynthFallback) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    
    // Add lowpass filter to make it soft and cozy
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    
    this.gainNode.connect(filter);
    filter.connect(this.ctx.destination);
  },

  // Synthesize a gentle chord progression
  playSynthLoop() {
    if (!this.ctx) return;
    
    // Chords definition (Hz frequencies)
    // Cmaj9, Am9, Fmaj9, G6
    const chords = [
      [130.81, 164.81, 196.00, 246.94, 293.66], // C3, E3, G3, B3, D4
      [110.00, 130.81, 164.81, 196.00, 246.94], // A2, C3, E3, G3, B3
      [87.31,  130.81, 220.00, 164.81, 392.00], // F2, C3, A3, E3, G4
      [98.00,  146.83, 246.94, 293.66, 329.63]  // G2, D3, B3, D4, E4
    ];
    
    let chordIndex = 0;
    
    const playChord = () => {
      if (!this.isPlaying || this.ctx.state === 'suspended') return;
      
      const now = this.ctx.currentTime;
      const notes = chords[chordIndex];
      const oscillators = [];
      
      // Volume envelope for the chord
      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0, now);
      // Soft attack
      chordGain.gain.linearRampToValueAtTime(0.04, now + 1.5);
      // Decay to sustain
      chordGain.gain.setValueAtTime(0.04, now + 5.0);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.8);
      chordGain.connect(this.gainNode);
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        // Alternating triangle and sine waves for a vintage Rhodes keyboard feel
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        // Slight detune for analog warm richness
        osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);
        
        osc.connect(chordGain);
        osc.start(now);
        osc.stop(now + 8.0);
        oscillators.push(osc);
      });
      
      chordIndex = (chordIndex + 1) % chords.length;
    };
    
    // Play immediately and schedule every 8 seconds
    playChord();
    this.synthInterval = setInterval(playChord, 8000);
  },

  // Procedural wind/rain audio generator (zero file download needed!)
  toggleRain() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!this.ctx) {
      this.ctx = new AudioContextClass();
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.isRainPlaying) {
      // Fade out rain
      if (this.rainGain) {
        this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
        setTimeout(() => {
          if (this.rainNode) {
            this.rainNode.disconnect();
            this.rainNode = null;
          }
          this.isRainPlaying = false;
        }, 1500);
      }
    } else {
      // Create white noise buffer
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      // Create noise source
      this.rainNode = this.ctx.createBufferSource();
      this.rainNode.buffer = noiseBuffer;
      this.rainNode.loop = true;
      
      // Lowpass Filter to shape noise into deep ambient rain
      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      
      // Bandpass Filter to add wind fluctuation
      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
      windFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      
      // Rain gain node
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      
      // Connect nodes
      this.rainNode.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      
      // Start and fade in
      this.rainNode.start(0);
      this.rainGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 2.0);
      this.isRainPlaying = true;
      
      // LFO modulation to simulate gusts of wind
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow cycle
      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(80, this.ctx.currentTime); // frequency modulation range
      
      osc.connect(oscGain);
      oscGain.connect(rainFilter.frequency);
      osc.start(0);
    }
  },

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    // Resume context if browser blocked it
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Play MP3 if it loaded, otherwise play Synth Fallback
    if (this.audio && !this.audio.error && this.audio.networkState !== 4) {
      this.audio.play().then(() => {
        // Fade in volume
        gsap.to(this.audio, {
          volume: this.targetVolume,
          duration: window.SITE_CONFIG.music.fadeInDuration || 3,
          ease: 'power1.out'
        });
      }).catch(err => {
        console.warn("Autoplay block or music fail, playing fallback synth:", err);
        this.startFallbackSynth();
      });
    } else {
      this.startFallbackSynth();
    }
  },

  startFallbackSynth() {
    if (!this.ctx) this.setupSynthFallback();
    if (this.ctx) {
      this.ctx.resume();
      this.playSynthLoop();
      // Fade in master synth volume
      this.gainNode.gain.linearRampToValueAtTime(1.0, this.ctx.currentTime + 3.0);
    }
  },

  setVolume(vol) {
    if (this.audio && !this.audio.error) {
      gsap.to(this.audio, { volume: vol, duration: 0.5 });
    }
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(vol / this.targetVolume, this.ctx.currentTime + 0.5);
    }
  }
};

// Expose AudioController globally
window.AudioController = AudioController;

const SectionController = {
  activeSection: 'section-welcome',
  
  // Transition wrapper
  goTo(sectionId, customQuote = null) {
    const current = document.getElementById(this.activeSection);
    const target = document.getElementById(sectionId);
    
    if (!target) return;
    
    window.TransitionLoader.transitionTo(() => {
      // Deactivate current
      if (current) current.classList.remove('active');
      // Activate target
      target.classList.add('active');
      this.activeSection = sectionId;
      
      // Fire section initializer
      this.onSectionEnter(sectionId);
    }, customQuote);
  },
  
  onSectionEnter(sectionId) {
    switch (sectionId) {
      case 'section-letter1':
        // Unfold letter 1 paper, then type
        const paper1 = document.getElementById('paper-letter1');
        const body1 = document.getElementById('letter1-body');
        const title1 = document.getElementById('letter1-title');
        const sig1 = document.getElementById('letter1-signature');
        
        // Hide content first
        body1.style.opacity = '0';
        title1.style.opacity = '0';
        sig1.style.opacity = '0';
        
        window.LoveAnimations.unfoldPaper(paper1, () => {
          // Show title, type body, then show signature
          title1.textContent = window.letter1.title;
          gsap.to(title1, { opacity: 1, duration: 0.6 });
          
          setTimeout(() => {
            body1.style.opacity = '1';
            window.LoveAnimations.typeText(body1, window.letter1.body, 35, () => {
              sig1.textContent = window.letter1.signature;
              gsap.fromTo(sig1, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 });
            });
          }, 600);
        });
        break;

      case 'section-gallery':
        // Initialize Gallery
        GalleryEngine.init();
        break;

      case 'section-quiz':
        // Initialize Quiz
        QuizEngine.start();
        break;

      case 'section-locker':
        // Show locker, reset input
        LockerEngine.reset();
        break;

      case 'section-letter2':
        // Unfold letter 2 paper, then type
        const paper2 = document.getElementById('paper-letter2');
        const body2 = document.getElementById('letter2-body');
        const title2 = document.getElementById('letter2-title');
        const sig2 = document.getElementById('letter2-signature');
        
        body2.style.opacity = '0';
        title2.style.opacity = '0';
        sig2.style.opacity = '0';
        
        window.LoveAnimations.unfoldPaper(paper2, () => {
          title2.textContent = window.letter2.title;
          gsap.to(title2, { opacity: 1, duration: 0.6 });
          
          setTimeout(() => {
            body2.style.opacity = '1';
            window.LoveAnimations.typeText(body2, window.letter2.body, 35, () => {
              sig2.textContent = window.letter2.signature;
              gsap.fromTo(sig2, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 });
            });
          }, 600);
        });
        break;

      case 'section-specialq':
        SpecialQuestionEngine.init();
        break;

      case 'section-birthday':
        BirthdayWishesEngine.start();
        break;
    }
  }
};

/* --- SWIPEABLE RETRO GALLERY ENGINE --- */
const GalleryEngine = {
  currentIdx: 0,
  deckEl: null,
  counterEl: null,
  photos: [],
  cards: [],
  isAnimating: false,
  snapBack: null,

  init() {
    this.deckEl = document.getElementById('polaroid-deck');
    this.counterEl = document.getElementById('gallery-counter');
    this.photos = window.SITE_CONFIG.gallery || [];
    this.currentIdx = 0;
    this.cards = [];
    this.isAnimating = false;

    if (!this.deckEl) return;

    this.render();
    this.updateActiveCard();
  },

  render() {
    this.deckEl.innerHTML = '';
    this.cards = [];

    // Render cards from bottom to top (idx 19 at bottom, idx 0 on top)
    for (let i = this.photos.length - 1; i >= 0; i--) {
      const data = this.photos[i];
      const card = document.createElement('div');
      card.className = 'gallery-polaroid';
      card.setAttribute('data-index', i);
      
      // Random rotation for retro realistic scatter look
      const rot = (Math.random() - 0.5) * 8; // -4 to 4 degrees
      card.style.setProperty('--rand-rot', `${rot}deg`);
      
      card.innerHTML = `
        <div class="polaroid-pin">❤️</div>
        <div class="gallery-card-inner">
          <div class="polaroid-tape"></div>
          <div class="polaroid-img-placeholder">
            <img class="polaroid-img" src="${data.image}" alt="${data.caption}" style="display: none;" onload="this.style.display='block'; if(this.nextElementSibling) this.nextElementSibling.style.display='none';">
            <div class="polaroid-img-fallback">🌟</div>
          </div>
          <p class="polaroid-caption">${data.caption}</p>
        </div>
      `;

      this.deckEl.appendChild(card);
      this.cards.unshift(card); // Keep index 0 as index 0 in the cards array
    }

    // Attach drag/touch to top card
    this.setupSwiping();
  },

  updateActiveCard() {
    this.cards.forEach((card, idx) => {
      card.classList.remove('active-top', 'active-next');
      
      // Calculate visual depth in stack
      const diff = idx - this.currentIdx;
      if (diff === 0) {
        card.classList.add('active-top');
        card.style.transform = `translate(0, 0) scale(1) rotate(var(--rand-rot))`;
        card.style.zIndex = '50';
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
      } else if (diff > 0 && diff <= 3) {
        // Show next 3 cards stacked behind
        card.classList.add('active-next');
        const scale = 1 - diff * 0.04;
        const translateY = diff * 8;
        const rotate = (idx % 2 === 0 ? 1 : -1) * (diff * 2);
        card.style.transform = `translate(0, -${translateY}px) scale(${scale}) rotate(${rotate}deg)`;
        card.style.zIndex = `${50 - diff}`;
        card.style.opacity = `${1 - diff * 0.25}`;
        card.style.pointerEvents = 'none';
      } else if (diff < 0) {
        // Card already swiped / passed (slide left)
        card.style.transform = `translate(-140%, 40px) scale(0.9) rotate(-20deg)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
      } else {
        // Future cards hidden deeper
        card.style.transform = `translate(0, -30px) scale(0.8) rotate(0deg)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
      }
    });

    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentIdx + 1} / ${this.photos.length}`;
    }
  },

  next() {
    if (this.isAnimating || this.currentIdx >= this.photos.length - 1) return;
    this.isAnimating = true;

    const topCard = this.cards[this.currentIdx];
    
    // Animate active card flying to the left (dismiss)
    gsap.to(topCard, {
      x: -400,
      y: 50,
      rotation: -25,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        this.currentIdx++;
        this.updateActiveCard();
        this.setupSwiping();
        this.isAnimating = false;
      }
    });
  },

  prev() {
    if (this.isAnimating || this.currentIdx <= 0) return;
    this.isAnimating = true;

    this.currentIdx--;
    const prevCard = this.cards[this.currentIdx];
    
    // Set fly out position initially on the left
    gsap.set(prevCard, { x: -400, y: 50, rotation: -25, opacity: 0 });
    this.updateActiveCard();

    // Animate flying back in from the left (reverse swipe)
    gsap.to(prevCard, {
      x: 0,
      y: 0,
      rotation: 'var(--rand-rot)',
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.1)',
      onComplete: () => {
        this.setupSwiping();
        this.isAnimating = false;
      }
    });
  },

  setupSwiping() {
    if (this.currentIdx >= this.cards.length) return;
    
    const topCard = this.cards[this.currentIdx];
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let hasMoved = false;

    const startDrag = (e) => {
      if (this.isAnimating) return;
      isDragging = true;
      hasMoved = false;
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      topCard.style.transition = 'none';
      topCard.style.cursor = 'grabbing';
    };

    const drag = (e) => {
      if (!isDragging) return;
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasMoved = true;
      }

      // Rotate card slightly while dragging
      const tilt = dx * 0.08;
      topCard.style.transform = `translate(${dx}px, ${dy}px) rotate(${tilt}deg) scale(1.02)`;
    };

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      topCard.style.cursor = 'grab';
      
      const clientX = e.type.startsWith('touchend') ? e.changedTouches[0].clientX : e.clientX;
      
      if (!hasMoved) {
        // It's a click / tap -> Click to change!
        this.next();
        return;
      }

      const dx = clientX - startX;
      const swipeThreshold = 80;

      if (dx < -swipeThreshold) {
        // Swipe Left -> Next
        this.next();
      } else if (dx > swipeThreshold) {
        // Swipe Right -> Prev (bring photo back)
        if (this.currentIdx > 0) {
          this.prev();
        } else {
          this.snapBack(topCard);
        }
      } else {
        // Snap back
        this.snapBack(topCard);
      }
    };

    const snapBack = (card) => {
      gsap.to(card, {
        x: 0,
        y: 0,
        rotation: 'var(--rand-rot)',
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    };
    
    this.snapBack = snapBack;

    // Clean up old listeners
    topCard.onmousedown = startDrag;
    topCard.ontouchstart = startDrag;
    window.onmousemove = drag;
    window.ontouchmove = drag;
    window.onmouseup = stopDrag;
    window.ontouchend = stopDrag;
  }
};

/* --- QUIZ ENGINE --- */
const QuizEngine = {
  currentIdx: 0,
  yesBtn: null,
  noBtn: null,
  qText: null,
  rText: null,
  nextBtn: null,
  progressBar: null,
  progressText: null,

  init() {
    this.yesBtn = document.getElementById('btn-quiz-yes');
    this.noBtn = document.getElementById('btn-quiz-no');
    this.qText = document.getElementById('quiz-question-text');
    this.rText = document.getElementById('quiz-reaction-text');
    this.nextBtn = document.getElementById('btn-quiz-next');
    this.progressBar = document.getElementById('quiz-bar-fill');
    this.progressText = document.getElementById('quiz-progress-text');

    if (this.yesBtn) {
      this.yesBtn.addEventListener('click', (e) => this.answer(true, e));
      this.noBtn.addEventListener('click', (e) => this.answer(false, e));
      this.nextBtn.addEventListener('click', () => this.nextQuestion());
    }
  },

  start() {
    this.currentIdx = 0;
    this.nextBtn.classList.add('hidden');
    this.yesBtn.className = 'btn-option btn-yes';
    this.noBtn.className = 'btn-option btn-no';
    this.rText.classList.remove('show');
    this.rText.textContent = '';
    this.showQuestion();
  },

  showQuestion() {
    const qData = window.quizQuestions[this.currentIdx];
    this.qText.textContent = qData.q;
    
    // Reset option states
    this.yesBtn.className = 'btn-option btn-yes';
    this.noBtn.className = 'btn-option btn-no';
    this.yesBtn.disabled = false;
    this.noBtn.disabled = false;
    this.rText.classList.remove('show');
    this.nextBtn.classList.add('hidden');

    // Update Progress
    const progressPercent = ((this.currentIdx + 1) / window.quizQuestions.length) * 100;
    this.progressBar.style.width = `${progressPercent}%`;
    this.progressText.textContent = `Question ${this.currentIdx + 1} of ${window.quizQuestions.length}`;
  },

  answer(isYes, event) {
    // Disable inputs
    this.yesBtn.disabled = true;
    this.noBtn.disabled = true;
    
    const qData = window.quizQuestions[this.currentIdx];
    
    if (isYes) {
      this.yesBtn.classList.add('selected-yes');
      this.noBtn.classList.add('disabled');
      this.rText.textContent = qData.yesResponse;
    } else {
      this.noBtn.classList.add('selected-no');
      this.yesBtn.classList.add('disabled');
      this.rText.textContent = qData.noResponse;
    }
    
    this.rText.classList.add('show');
    this.nextBtn.classList.remove('hidden');

    // Trigger sweet floating heart on click target
    this.spawnAnswerHeart(event.clientX, event.clientY);
  },

  spawnAnswerHeart(x, y) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.position = 'fixed';
    heart.style.left = `${x - 15}px`;
    heart.style.top = `${y - 15}px`;
    heart.style.fontSize = '2rem';
    heart.style.zIndex = '500';
    heart.style.pointerEvents = 'none';
    document.body.appendChild(heart);

    gsap.to(heart, {
      y: y - 100,
      x: x + (Math.random() - 0.5) * 80,
      opacity: 0,
      scale: 1.5,
      duration: 1.2,
      ease: 'power2.out',
      onComplete: () => heart.remove()
    });
  },

  nextQuestion() {
    this.currentIdx++;
    if (this.currentIdx < window.quizQuestions.length) {
      this.showQuestion();
    } else {
      // Transition to Locker Section with custom note
      SectionController.goTo('section-locker', "Vault locked. Unlocking Diary...");
    }
  }
};

/* --- VAULT LOCKER ENGINE --- */
const LockerEngine = {
  inputField: null,
  errorField: null,
  hintField: null,
  lockedSvg: null,
  unlockedSvg: null,
  lockerBox: null,
  
  init() {
    this.inputField = document.getElementById('locker-password-input');
    this.errorField = document.getElementById('locker-error-display');
    this.hintField = document.getElementById('locker-hint-display');
    this.lockedSvg = document.getElementById('locker-svg-closed');
    this.unlockedSvg = document.getElementById('locker-svg-open');
    this.lockerBox = document.getElementById('diary-locker-body');

    // Add event listeners to custom keypad buttons
    const keys = document.querySelectorAll('.keypad-btn:not(.keypad-clear):not(.keypad-enter)');
    keys.forEach(k => {
      k.addEventListener('click', () => {
        if (this.inputField.value.length < 6) {
          this.inputField.value += k.getAttribute('data-val');
          this.errorField.textContent = '';
        }
      });
    });

    document.getElementById('btn-locker-clear').addEventListener('click', () => {
      this.inputField.value = '';
      this.errorField.textContent = '';
    });

    document.getElementById('btn-locker-enter').addEventListener('click', () => this.checkPassword());
  },

  reset() {
    this.inputField.value = '';
    this.errorField.textContent = '';
    this.hintField.textContent = window.LOCKER_HINT;
    this.lockedSvg.classList.remove('hidden');
    this.unlockedSvg.classList.add('hidden');
    document.querySelector('.locker-keyhole').classList.remove('unlock-pulse');
  },

  checkPassword() {
    const inputVal = this.inputField.value;
    const correctPass = window.LOCKER_PASSWORD;

    if (inputVal === correctPass) {
      // SUCCESS!
      this.errorField.style.color = '#4caf50';
      this.errorField.textContent = "Unlocked! Opening Diary...";
      
      const keyhole = document.querySelector('.locker-keyhole');
      keyhole.classList.add('unlock-pulse');
      
      setTimeout(() => {
        this.lockedSvg.classList.add('hidden');
        this.unlockedSvg.classList.remove('hidden');
        
        // Explode hearts!
        window.LoveAnimations.triggerHeartExplosion();
        
        // Wait another 1.2s then transition to second letter
        setTimeout(() => {
          SectionController.goTo('section-letter2', "Opening letter vault...");
        }, 1200);
      }, 500);

    } else {
      // FAIL!
      this.inputField.value = '';
      const wrongClues = [
        "Incorrect passcode. Try again! ❤️",
        "Ah, not quite. Think of our special numbers... 😉",
        "Nope! Look closely at the clue. 🕵️‍♀️",
        "Wait, are you guessing? The hint is right here! 😜"
      ];
      this.errorField.style.color = '#ff4d6d';
      this.errorField.textContent = wrongClues[Math.floor(Math.random() * wrongClues.length)];
      
      // Shake codepad card
      this.lockerBox.classList.add('shake-element');
      setTimeout(() => {
        this.lockerBox.classList.remove('shake-element');
      }, 500);
    }
  }
};

/* --- OPEN WHEN ENVELOPES ENGINE --- */
const EnvelopesEngine = {
  modal: null,
  modalTitle: null,
  modalBody: null,

  init() {
    this.modal = document.getElementById('envelope-modal');
    this.modalTitle = document.getElementById('envelope-modal-title');
    this.modalBody = document.getElementById('envelope-modal-body');

    // Add listeners to shelf items
    const envs = document.querySelectorAll('.envelope-item');
    envs.forEach(env => {
      env.addEventListener('click', () => {
        const idx = parseInt(env.getAttribute('data-index'), 10);
        this.openEnvelope(idx);
      });
    });

    document.getElementById('btn-close-envelope-modal').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  },

  openEnvelope(index) {
    const data = window.SITE_CONFIG.openWhenEnvelopes[index];
    if (!data) return;

    this.modalTitle.textContent = data.title;
    this.modalBody.textContent = data.content;
    
    this.modal.classList.remove('hidden');
  },

  close() {
    this.modal.classList.add('hidden');
  }
};

/* --- RUNAWAY SPECIAL QUESTION ENGINE --- */
/* --- SWAPPING SPECIAL QUESTION ENGINE --- */
const SpecialQuestionEngine = {
  btn1: null,
  btn2: null,
  card: null,
  yesClicks: 0,

  init() {
    this.btn1 = document.getElementById('btn-special-yes');
    this.btn2 = document.getElementById('btn-special-no');
    this.card = document.getElementById('special-q-card');
    this.yesClicks = 0;

    // Set initial classes and text content
    this.btn1.className = 'btn-special btn-yes-label';
    this.btn1.querySelector('span').textContent = 'YES';
    
    this.btn2.className = 'btn-special btn-no-label';
    this.btn2.querySelector('span').textContent = 'NO';
    
    document.getElementById('special-attempts-display').textContent = '';

    // Click listeners
    this.btn1.onclick = () => this.handleClick(this.btn1, this.btn2);
    this.btn2.onclick = () => this.handleClick(this.btn2, this.btn1);
  },

  handleClick(clickedBtn, otherBtn) {
    const currentText = clickedBtn.querySelector('span').textContent.trim();
    const display = document.getElementById('special-attempts-display');
    
    if (currentText === 'YES') {
      this.yesClicks++;
      
      // Swap labels and styles
      clickedBtn.querySelector('span').textContent = 'NO';
      clickedBtn.className = 'btn-special btn-no-label';
      
      otherBtn.querySelector('span').textContent = 'YES';
      otherBtn.className = 'btn-special btn-yes-label';
      
      // Spawn small floating heart at clicked button coordinates
      const rect = clickedBtn.getBoundingClientRect();
      if (window.LoveAnimations && window.LoveAnimations.triggerHeartExplosion) {
        if (window.confetti) {
          confetti({
            particleCount: 8,
            angle: 90,
            spread: 30,
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight
            },
            colors: ['#ff4d6d', '#ff85a2']
          });
        }
      }

      if (this.yesClicks >= 5) {
        display.style.color = '#4caf50';
        display.textContent = "I knew it! You are extremely happy with me! ❤️";
        
        // Disable both buttons
        clickedBtn.style.pointerEvents = 'none';
        otherBtn.style.pointerEvents = 'none';
        
        window.LoveAnimations.triggerHeartExplosion();
        
        setTimeout(() => {
          SectionController.goTo('section-birthday', "Here comes the surprise...");
        }, 1500);
      } else {
        const remaining = 5 - this.yesClicks;
        const sweetPrompts = [
          `Are you sure? Click YES ${remaining} more times! 😉`,
          `Loop active! Click YES ${remaining} more times! 🥰`,
          `Don't stop now! Click YES ${remaining} more times! 💖`,
          `Just ${remaining} more click on YES! 🌸`
        ];
        display.style.color = '#ff4d6d';
        display.textContent = sweetPrompts[this.yesClicks - 1] || `Click YES ${remaining} more times! ❤️`;
        
        // Soft click bounce
        gsap.fromTo(clickedBtn, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' });
      }
    } else {
      // Clicked NO
      this.card.classList.add('shake-element');
      display.style.color = '#ff4d6d';
      display.textContent = "Wait... NO is not an option! You must click YES! 😜";
      
      setTimeout(() => {
        this.card.classList.remove('shake-element');
      }, 500);
    }
  }
};

/* --- INTERACTIVE BIRTHDAY CAKE & WISHES ENGINE --- */
const BirthdayWishesEngine = {
  wishIdx: 0,
  wishesBox: null,
  cakeEl: null,
  flameEl: null,
  instructionEl: null,

  start() {
    this.wishesBox = document.getElementById('wishes-container');
    this.cakeEl = document.getElementById('cake-interactive');
    this.flameEl = document.getElementById('cake-flame');
    this.instructionEl = document.getElementById('cake-instruction');
    this.wishIdx = 0;
    
    this.wishesBox.innerHTML = '';
    this.cakeEl.style.display = 'flex';
    this.flameEl.classList.remove('blown-out');
    this.instructionEl.style.opacity = '1';
    
    // Add cake click listener to blow flame
    this.cakeEl.onclick = () => this.blowCandle();

    // Start showing cinematic typewriter statements
    this.playCinematicMessages();
  },

  playCinematicMessages() {
    const list = window.SITE_CONFIG.birthdayWishes;
    
    const showNext = () => {
      if (this.wishIdx < list.length) {
        const sentence = document.createElement('div');
        sentence.className = 'wishes-sentence';
        this.wishesBox.appendChild(sentence);
        
        // Set visible
        sentence.classList.add('active');
        
        // Type sentence
        window.LoveAnimations.typeText(sentence, list[this.wishIdx], 40, () => {
          // Keep visible briefly, then trigger next sentence
          setTimeout(() => {
            sentence.classList.remove('active');
            // Remove from dome after animation
            setTimeout(() => {
              sentence.remove();
              this.wishIdx++;
              showNext();
            }, 600);
          }, 3000);
        });
      } else {
        // Complete wishes, reveal final credits and trigger massive fireworks
        this.showFinalCredits();
      }
    };

    showNext();
  },

  blowCandle() {
    if (this.flameEl.classList.contains('blown-out')) return;
    
    // Extinguish
    this.flameEl.classList.add('blown-out');
    this.instructionEl.textContent = "Your wish is heading to the stars! ✨";
    
    // Trigger massive heart explosion
    window.LoveAnimations.triggerHeartExplosion();
    
    // Repeat explosion
    setTimeout(() => {
      window.LoveAnimations.triggerHeartExplosion();
    }, 400);
  },

  showFinalCredits() {
    const credits = document.getElementById('final-credits-box');
    if (credits) {
      credits.classList.remove('hidden');
      gsap.fromTo(credits, 
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: 'power2.out' }
      );
    }
  }
};

/* --- FLOATING COMPLIMENTS STICKY NOTES --- */
const StickyNotesEngine = {
  container: null,

  init() {
    this.container = document.getElementById('sticky-notes-container');
  },

  spawnNote(text) {
    if (!this.container) return;

    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.textContent = text;
    
    // Random position and angle
    const x = 5 + Math.random() * (window.innerWidth - 160);
    const y = 5 + Math.random() * (window.innerHeight - 140);
    const angle = (Math.random() - 0.5) * 15;
    
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    note.style.setProperty('--angle', `${angle}deg`);
    note.style.opacity = '0';
    
    this.container.appendChild(note);

    // Fade in and slide down
    gsap.fromTo(note, 
      { opacity: 0, scale: 0.8, y: -20 },
      { opacity: 0.9, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );

    // Make note draggable via mouse or touch
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    const startDrag = (e) => {
      isDragging = true;
      note.style.cursor = 'grabbing';
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      offset.x = clientX - note.offsetLeft;
      offset.y = clientY - note.offsetTop;
      gsap.to(note, { scale: 1.05, duration: 0.2 });
    };

    const drag = (e) => {
      if (!isDragging) return;
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      note.style.left = `${clientX - offset.x}px`;
      note.style.top = `${clientY - offset.y}px`;
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      note.style.cursor = 'grab';
      gsap.to(note, { scale: 1, duration: 0.2 });
    };

    note.addEventListener('mousedown', startDrag);
    note.addEventListener('touchstart', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    
    // Auto fadeout note after 8 seconds
    setTimeout(() => {
      gsap.to(note, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        onComplete: () => note.remove()
      });
    }, 9000);
  },

  startComplimentSpawner() {
    const triggerSpawn = () => {
      // Don't spawn if user is on Welcome screen or Birthday Wishes screen
      const activeSec = SectionController.activeSection;
      if (activeSec !== 'section-welcome' && activeSec !== 'section-birthday') {
        const compliments = window.SITE_CONFIG.compliments;
        const msg = compliments[Math.floor(Math.random() * compliments.length)];
        this.spawnNote(msg);
      }
      // Schedule next spawn between 10-18 seconds
      setTimeout(triggerSpawn, 11000 + Math.random() * 8000);
    };

    setTimeout(triggerSpawn, 6000);
  }
};

/* --- BOOTSTRAP INITIALIZER --- */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize background engines
  window.LoveAnimations.initThree();
  window.TransitionLoader.init();
  window.AudioController.init();

  // Dynamically merge/split polaroid rows on screen size checks (All 8 scrollable in one row on mobile)
  const handleMobileGallery = () => {
    const isMobile = window.innerWidth <= 1024;
    const ropeLeftItems = document.querySelector('.rope-left .rope-items');
    const ropeRightItems = document.querySelector('.rope-right .rope-items');
    const ropeRight = document.querySelector('.rope-right');
    
    if (!ropeLeftItems || !ropeRightItems || !ropeRight) return;
    
    if (isMobile) {
      const rightWrappers = Array.from(ropeRightItems.querySelectorAll('.polaroid-wrapper'));
      rightWrappers.forEach(item => {
        ropeLeftItems.appendChild(item);
      });
      ropeRight.style.display = 'none';
    } else {
      const allWrappers = Array.from(ropeLeftItems.querySelectorAll('.polaroid-wrapper'));
      if (allWrappers.length > 4) {
        ropeRight.style.display = 'flex';
        // Move polaroids 5-8 back to right rope
        for (let i = 4; i < allWrappers.length; i++) {
          ropeRightItems.appendChild(allWrappers[i]);
        }
      }
    }
  };

  // Run immediately and on screen resize
  handleMobileGallery();
  window.addEventListener('resize', handleMobileGallery);

  // Handle Polaroid images cache loading checks (Ensures images display and fallbacks hide)
  const checkPolaroidImages = () => {
    const images = document.querySelectorAll('.polaroid-img');
    images.forEach(img => {
      const fallback = img.nextElementSibling;
      const displayImage = () => {
        img.style.display = 'block';
        if (fallback && fallback.classList.contains('polaroid-img-fallback')) {
          fallback.style.display = 'none';
        }
      };

      if (img.complete && img.naturalWidth > 0) {
        displayImage();
      }

      img.addEventListener('load', displayImage);
      img.addEventListener('error', () => {
        img.style.display = 'none';
        if (fallback && fallback.classList.contains('polaroid-img-fallback')) {
          fallback.style.display = 'flex';
        }
      });
    });
  };

  checkPolaroidImages();
  
  // 2. Initialize feature controllers
  QuizEngine.init();
  LockerEngine.init();
  EnvelopesEngine.init();
  StickyNotesEngine.init();

  // 3. Setup Navigation buttons listeners
  const beginBtn = document.getElementById('btn-begin-journey');
  const toGalleryBtn = document.getElementById('btn-to-gallery');
  const toQuizBtn = document.getElementById('btn-to-quiz');
  const toSpecialqBtn = document.getElementById('btn-to-specialq');
  
  const fsModal = document.getElementById('fullscreen-prompt-modal');
  const acceptFsBtn = document.getElementById('btn-fs-accept');
  const declineFsBtn = document.getElementById('btn-fs-decline');

  // Welcome Screen Begin click -> Immediately play music and start the journey (no fullscreen modal option)
  beginBtn.addEventListener('click', () => {
    // Play Background music
    window.AudioController.play();
    
    // Go to first letter section
    SectionController.goTo('section-letter1', "Opening My Heart...");
    
    // Start Spawning handwritten notes
    StickyNotesEngine.startComplimentSpawner();
  });

  // Connect navigation button events
  if (toGalleryBtn) {
    toGalleryBtn.addEventListener('click', () => {
      SectionController.goTo('section-gallery', "Opening Polaroid Gallery...");
    });
  }

  toQuizBtn.addEventListener('click', () => {
    SectionController.goTo('section-quiz', "Preparing the Quiz...");
  });

  toSpecialqBtn.addEventListener('click', () => {
    SectionController.goTo('section-specialq', "Almost there...");
  });

  // 4. Music widget click listener
  const musicWidget = document.getElementById('music-controller');
  musicWidget.addEventListener('click', () => {
    if (window.AudioController.isPlaying) {
      // Pause
      if (window.AudioController.audio && !window.AudioController.audio.paused) {
        window.AudioController.audio.pause();
      }
      if (window.AudioController.ctx && window.AudioController.ctx.state === 'running') {
        window.AudioController.ctx.suspend();
      }
      window.AudioController.isPlaying = false;
      musicWidget.classList.remove('playing');
      musicWidget.querySelector('.music-tooltip').textContent = "Play Music";
    } else {
      // Play
      window.AudioController.play();
      musicWidget.classList.add('playing');
      musicWidget.querySelector('.music-tooltip').textContent = "Mute Music";
    }
  });

  // 5. Rain ambient widget listener
  const ambientWidget = document.getElementById('ambient-controller');
  ambientWidget.addEventListener('click', () => {
    window.AudioController.toggleRain();
    
    if (window.AudioController.isRainPlaying) {
      ambientWidget.classList.add('active');
      ambientWidget.style.color = '#ff4d6d';
      ambientWidget.style.borderColor = '#ff4d6d';
    } else {
      ambientWidget.classList.remove('active');
      ambientWidget.style.color = '#f5e6d3';
      ambientWidget.style.borderColor = 'rgba(193, 18, 31, 0.2)';
    }
  });

  // Check if music is already starting (some browsers allow immediate autoplay on refresh/action history)
  setTimeout(() => {
    if (window.AudioController.isPlaying) {
      musicWidget.classList.add('playing');
      musicWidget.querySelector('.music-tooltip').textContent = "Mute Music";
    }
  }, 1000);
});
