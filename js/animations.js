/*
  Retro Love Story - Animations & Background Effects
  Includes:
  - Three.js lightweight background (stars, floating hearts, glowing fireflies, camera parallax)
  - Dynamically generated procedural particle textures (no external image assets needed)
  - Shooting star effect
  - GSAP animations (typing, paper unfolds, card transitions)
*/

const LoveAnimations = {
  // Three.js instances
  scene: null,
  camera: null,
  renderer: null,
  stars: null,
  hearts: null,
  fireflies: null,
  
  // Parallax target
  targetMouseX: 0,
  targetMouseY: 0,
  mouseX: 0,
  mouseY: 0,

  // Initialize Three.js
  initThree() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Setup Scene, Camera & Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.z = 200;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // 2. Create Particle Layers
    this.createStars();
    this.createFireflies();
    this.createHearts();

    // 3. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('touchmove', (e) => this.onTouchMove(e));

    // 4. Start Loop
    this.animate();
    this.startShootingStars();
  },

  // Helper to create a procedural heart texture
  createHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Create a beautiful glowing red/rose heart
    ctx.fillStyle = '#ff4d6d';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#c1121f';

    ctx.beginPath();
    // Path for heart centered in 64x64 canvas
    ctx.moveTo(32, 20);
    ctx.bezierCurveTo(32, 10, 16, 8, 16, 22);
    ctx.bezierCurveTo(16, 36, 32, 50, 32, 56);
    ctx.bezierCurveTo(32, 50, 48, 36, 48, 22);
    ctx.bezierCurveTo(48, 8, 32, 10, 32, 20);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  },

  // Helper to create a procedural glowing dot/star texture
  createSparkleTexture(color = '#ffffff', glowColor = '#ff4d6d') {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, color);
    grad.addColorStop(0.2, color);
    grad.addColorStop(0.4, glowColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  },

  // Stars Particle System (Static / Very slow rotate)
  createStars() {
    const starCount = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Random coordinates in space
      positions[i] = (Math.random() - 0.5) * 800;
      positions[i + 1] = (Math.random() - 0.5) * 800;
      positions[i + 2] = (Math.random() - 0.5) * 400 - 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starTexture = this.createSparkleTexture('#ffffff', '#f5e6d3');
    const material = new THREE.PointsMaterial({
      size: 3,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  },

  // Fireflies (Glow, walk randomly)
  createFireflies() {
    const fireflyCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);
    this.fireflyVelocities = [];

    for (let i = 0; i < fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

      // Small velocities in x, y, z
      this.fireflyVelocities.push({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.2
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const fireflyTexture = this.createSparkleTexture('#ffdd67', '#ff85a2');
    const material = new THREE.PointsMaterial({
      size: 6,
      map: fireflyTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8
    });

    this.fireflies = new THREE.Points(geometry, material);
    this.scene.add(this.fireflies);
  },

  // Floating Hearts (Drift upward)
  createHearts() {
    const heartCount = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(heartCount * 3);
    this.heartSpeeds = [];

    for (let i = 0; i < heartCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = -250 + Math.random() * 500; // Start dispersed
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      // Vertical speed + horizontal wobble
      this.heartSpeeds.push({
        y: 0.3 + Math.random() * 0.6,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobbleAmount: 0.1 + Math.random() * 0.3,
        angle: Math.random() * Math.PI
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const heartTexture = this.createHeartTexture();
    const material = new THREE.PointsMaterial({
      size: 15,
      map: heartTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85
    });

    this.hearts = new THREE.Points(geometry, material);
    this.scene.add(this.hearts);
  },

  // Main Render Loop
  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Stars slow rotation
    if (this.stars) {
      this.stars.rotation.y += 0.0003;
      this.stars.rotation.x += 0.0001;
    }

    // 2. Fireflies random walk
    if (this.fireflies) {
      const positions = this.fireflies.geometry.attributes.position.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        // Apply velocity
        positions[i * 3] += this.fireflyVelocities[i].x;
        positions[i * 3 + 1] += this.fireflyVelocities[i].y;
        positions[i * 3 + 2] += this.fireflyVelocities[i].z;

        // Bounce back if too far
        const bounds = 300;
        if (Math.abs(positions[i * 3]) > bounds) this.fireflyVelocities[i].x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > bounds) this.fireflyVelocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > bounds) this.fireflyVelocities[i].z *= -1;
      }
      this.fireflies.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Hearts float upwards and wobble
    if (this.hearts) {
      const positions = this.hearts.geometry.attributes.position.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = this.heartSpeeds[i];
        
        // Float Up
        positions[i * 3 + 1] += speed.y;
        
        // Wobble horizontally
        speed.angle += speed.wobbleSpeed;
        positions[i * 3] += Math.sin(speed.angle) * speed.wobbleAmount;

        // Reset heart to bottom if it goes off top screen
        if (positions[i * 3 + 1] > 250) {
          positions[i * 3 + 1] = -250;
          positions[i * 3] = (Math.random() - 0.5) * 400;
        }
      }
      this.hearts.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Smooth Camera Parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    this.camera.position.x = this.mouseX * 30;
    this.camera.position.y = -this.mouseY * 30;
    this.camera.lookAt(this.scene.position);

    // 5. Render Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  },

  // Dynamic heart explosion effect at locker unlock or final screen
  triggerHeartExplosion(centerX = 0, centerY = 0) {
    if (window.confetti) {
      // Use Canvas Confetti library to throw customized heart shapes
      const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.6,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#c1121f', '#ff4d6d', '#ff85a2', '#f5e6d3']
      };

      confetti({
        ...defaults,
        particleCount: 80,
        scalar: 1.5,
        shapes: ['heart']
      });

      // Regular sparkles
      confetti({
        ...defaults,
        particleCount: 50,
        scalar: 1,
        shapes: ['circle']
      });
    }
  },

  // Handles window resize for Three.js
  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  // Tracks cursor for camera float
  onMouseMove(event) {
    this.targetMouseX = (event.clientX / window.innerWidth) - 0.5;
    this.targetMouseY = (event.clientY / window.innerHeight) - 0.5;
  },

  // Tracks touches for mobile floating camera
  onTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.targetMouseX = (touch.clientX / window.innerWidth) - 0.5;
      this.targetMouseY = (touch.clientY / window.innerHeight) - 0.5;
    }
  },

  // Periodically triggers a CSS-based shooting star across the screen
  startShootingStars() {
    const createStar = () => {
      const star = document.createElement('div');
      star.style.position = 'fixed';
      star.style.width = '120px';
      star.style.height = '2px';
      star.style.background = 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,77,109,0.3), transparent)';
      star.style.top = `${Math.random() * 40}vh`;
      star.style.left = `-150px`;
      star.style.transform = 'rotate(-25deg)';
      star.style.zIndex = '3';
      star.style.pointerEvents = 'none';
      star.style.borderRadius = '50%';
      star.style.filter = 'drop-shadow(0 0 4px #ff4d6d)';
      document.body.appendChild(star);

      // GSAP animate shooting star across screen
      gsap.to(star, {
        x: window.innerWidth + 300,
        y: (window.innerWidth + 300) * Math.tan(25 * Math.PI / 180),
        duration: 1.2 + Math.random() * 0.8,
        ease: 'power2.out',
        onComplete: () => {
          star.remove();
        }
      });

      // Schedule next star
      setTimeout(createStar, 6000 + Math.random() * 12000);
    };

    // Delay first star
    setTimeout(createStar, 4000);
  },

  // Typewriter text animation using GSAP
  typeText(element, text, speed = 40, callback) {
    if (!element) return;
    element.innerHTML = '';
    
    let index = 0;
    let isCompleted = false;
    const paperParent = element.closest('.vintage-paper') || element;

    const autoScroll = () => {
      element.scrollTop = element.scrollHeight;
    };

    const finishText = () => {
      if (isCompleted) return;
      isCompleted = true;
      clearInterval(interval);
      paperParent.removeEventListener('click', clickHandler);
      element.innerHTML = text.replace(/\n/g, '<br>');
      autoScroll();
      if (callback) callback();
    };

    const clickHandler = () => {
      finishText();
    };

    paperParent.addEventListener('click', clickHandler);

    const interval = setInterval(() => {
      if (index < text.length) {
        // Handles newlines correctly
        if (text[index] === '\n') {
          element.innerHTML += '<br>';
        } else {
          element.innerHTML += text[index];
        }
        index++;
        
        // Auto scroll inside the letter-body element
        autoScroll();
      } else {
        finishText();
      }
    }, speed);
    
    // Return interval to allow cancellation if user skips
    return interval;
  },

  // Unfolding letter animation sequence
  unfoldPaper(paperElement, callback) {
    if (!paperElement) return;
    
    // Remove rotation class to activate 3D unfold transform
    paperElement.classList.remove('unfold-initial');
    paperElement.classList.add('unfolded');
    
    // Rotate 3D GSAP animation
    gsap.fromTo(paperElement, 
      { rotationX: 85, scale: 0.9, opacity: 0 },
      { 
        rotationX: 0, 
        scale: 1, 
        opacity: 1, 
        duration: 1.5, 
        ease: 'power3.out', 
        onComplete: callback 
      }
    );
  }
};

// Expose LoveAnimations globally
window.LoveAnimations = LoveAnimations;
