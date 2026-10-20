import { CONFIG } from './config.js';
import { audio } from './audio.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Universal Word-by-Word Text Reveal Animator
 * Pre-renders all words as <span class="word-token hidden">word</span>
 * Locks the exact layout and line breaks from frame 1 so NO layout shifts occur.
 * Smoothly reveals words sequentially.
 * Supports skip-on-click, reduced-motion preferences, and permanent visibility.
 */
function animateWordReveal(element, options = {}) {
  if (!element) return null;
  const speed = options.speed || 50;
  const onComplete = options.onComplete || null;
  const skipOnClick = options.skipOnClick !== false;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Preserve existing HTML or text
  if (options.text !== undefined) {
    element.dataset.origText = options.text;
  } else if (!element.dataset.origText) {
    element.dataset.origText = element.innerText.trim();
  }
  const rawText = element.dataset.origText;
  
  // Parse paragraphs and line breaks cleanly
  const paragraphs = rawText.split(/\n+/);
  element.innerHTML = paragraphs.map(p => {
    const words = p.trim().split(/\s+/).filter(Boolean);
    return words.map(w => `<span class="word-token hidden">${escapeHtml(w)}</span>`).join(' ');
  }).join('<br><br>');

  const tokens = element.querySelectorAll('.word-token');
  if (tokens.length === 0) return null;

  if (prefersReduced) {
    tokens.forEach(t => t.classList.remove('hidden'));
    element.dataset.revealed = 'true';
    if (onComplete) onComplete();
    return { skip: () => {}, cancel: () => {} };
  }

  let currentIndex = 0;
  let timer = null;
  let isDone = false;

  const skip = () => {
    if (isDone) return;
    isDone = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    tokens.forEach(t => t.classList.remove('hidden'));
    element.dataset.revealed = 'true';
    if (onComplete) onComplete();
  };

  if (skipOnClick) {
    const clickHandler = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      skip();
      element.removeEventListener('click', clickHandler);
    };
    element.addEventListener('click', clickHandler);
  }

  timer = setInterval(() => {
    if (currentIndex < tokens.length) {
      tokens[currentIndex].classList.remove('hidden');
      currentIndex++;
    } else {
      isDone = true;
      clearInterval(timer);
      timer = null;
      element.dataset.revealed = 'true';
      if (onComplete) onComplete();
    }
  }, speed);

  return {
    skip,
    cancel: () => {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };
}

class BirthdayExperience {
  constructor() {
    this.screens = [
      'welcome', 'lock', 'reveal', 'begin',
      'balloonPop', 'makeAWish', 'cake', 'cakeSlice',
      'memories', 'letters', 'cameraReveal', 'quiz',
      'matchGame', 'scratchCard', 'final'
    ];
    this.currentScreenIndex = 0;

    // State
    this.enteredPin = '';
    this.poppedBalloons = new Set();
    this.blownCandles = 0;
    this.totalCandles = CONFIG.cake.totalCandles || 5;
    this.cakeCut = false;
    this.readLetters = new Set();
    this.cameraFired = false;
    this.quizIndex = 0;
    this.quizScore = 0;

    // Match game state
    this.matchCards = [];
    this.flippedIndices = [];
    this.matchedPairs = 0;
    this.matchMoves = 0;
    this.matchHints = 3;
    this.matchTimer = null;
    this.matchSeconds = 0;

    // Scratch card state
    this.isScratching = false;
    this.scratchRevealed = false;
  }

  init() {
    audio.init();
    this.setupAudioHUD();
    this.setupDecorations();
    this.setupWelcome();
    this.setupLock();
    this.setupReveal();
    this.setupBegin();
    this.setupBalloons();
    this.setupMakeAWish();
    this.setupCake();
    this.setupMemories();
    this.setupLetters();
    this.setupCamera();
    this.setupQuiz();
    this.setupMatchGame();
    this.setupScratchCard();
    this.setupFinal();

    const urlParams = new URLSearchParams(window.location.search);
    const initialScreen = urlParams.get('screen') || 'welcome';
    this.showScreen(initialScreen);

    const letterParam = urlParams.get('letter');
    if (letterParam !== null) {
      setTimeout(() => {
        const envs = document.querySelectorAll('.envelope-item');
        const idx = parseInt(letterParam, 10);
        if (envs[idx]) envs[idx].click();

        const closeAfter = urlParams.get('closeAfter');
        if (closeAfter) {
          setTimeout(() => {
            const closeBtn = document.getElementById('letterModalClose');
            if (closeBtn) closeBtn.click();
          }, parseInt(closeAfter, 10));
        }
      }, 350);
    }

    const readAllLetters = urlParams.get('readAllLetters');
    if (readAllLetters) {
      setTimeout(() => {
        const envs = document.querySelectorAll('.envelope-item');
        envs.forEach((env, i) => {
          this.readLetters.add(i);
          env.classList.add('read');
        });
        const counterEl = document.getElementById('lettersCounter');
        if (counterEl) counterEl.innerText = '4 of 4 letters read';
        const continueBtn = document.getElementById('lettersContinueBtn');
        if (continueBtn) continueBtn.style.display = 'inline-flex';
      }, 350);
    }

    const snap = urlParams.get('snap');
    if (snap) {
      setTimeout(() => {
        const cam = document.getElementById('cameraBodyWrap');
        if (cam) cam.click();
      }, 350);
    }

    const popParam = urlParams.get('popBalloons');
    if (popParam !== null) {
      setTimeout(() => {
        const balloons = document.querySelectorAll('.balloon-item');
        const count = parseInt(popParam, 10);
        for (let i = 0; i < count && i < balloons.length; i++) {
          setTimeout(() => balloons[i].click(), i * 350);
        }
      }, 350);
    }

    const quizParam = urlParams.get('quizAnswers');
    if (quizParam !== null) {
      setTimeout(() => {
        const answers = quizParam.split(',').map(s => parseInt(s.trim(), 10));
        let qIdx = 0;
        const answerNext = () => {
          if (qIdx >= answers.length) return;
          const btns = document.querySelectorAll('.quiz-option-btn');
          const ans = answers[qIdx];
          if (btns[ans]) btns[ans].click();
          qIdx++;
          setTimeout(answerNext, 1050);
        };
        answerNext();
      }, 400);
    }

    const blowParam = urlParams.get('blowCandles');
    if (blowParam) {
      setTimeout(() => {
        const stage = document.getElementById('cakeStage');
        for (let i = 0; i < 5; i++) {
          setTimeout(() => { if (stage) stage.click(); }, i * 220);
        }
      }, 350);
    }

    const cutParam = urlParams.get('cutCake');
    if (cutParam) {
      setTimeout(() => {
        if (this.executeVerticalCut) this.executeVerticalCut();
      }, 400);
    }

    const openVideoParam = urlParams.get('openVideo');
    if (openVideoParam) {
      setTimeout(() => {
        const replay = document.getElementById('replayBtn');
        if (replay) replay.click();
      }, 400);
    }

    const scrollParam = urlParams.get('scroll');
    if (scrollParam) {
      setTimeout(() => {
        const memoriesList = document.getElementById('memoriesList');
        if (memoriesList) memoriesList.scrollTop = parseInt(scrollParam, 10);
      }, 400);
    }

    const openSlotParam = urlParams.get('openSlot');
    if (openSlotParam) {
      setTimeout(() => {
        const card = document.querySelector(`.memory-polaroid[data-slot="${openSlotParam}"]`);
        if (card) card.click();
      }, 450);
    }

    const revealScratchParam = urlParams.get('revealScratch');
    if (revealScratchParam) {
      setTimeout(() => {
        const canvas = document.getElementById('scratchCanvas');
        if (canvas) {
          canvas.style.opacity = '0';
          setTimeout(() => {
            canvas.style.display = 'none';
            const continueBtn = document.getElementById('scratchContinueBtn');
            if (continueBtn) continueBtn.style.display = 'inline-flex';
          }, 300);
        }
      }, 400);
    }
  }

  // Screen Navigation
  showScreen(screenName) {
    const idx = this.screens.indexOf(screenName);
    if (idx !== -1) this.currentScreenIndex = idx;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
    }

    // Specific screen init triggers
    if (screenName === 'scratchCard' && !this.scratchCanvasInit) {
      this.initScratchCanvas();
    }
    if (screenName === 'memories') {
      const continueBtn = document.getElementById('memoriesContinueBtn');
      if (continueBtn) {
        continueBtn.style.display = this.albumsNavRevealed ? 'inline-flex' : 'none';
      }
    }

    // Trigger word-by-word reveal for meaningful text in the activated scene
    setTimeout(() => {
      if (screenName === 'welcome') {
        const sub = document.querySelector('#screen-welcome .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'reveal') {
        const p = document.getElementById('revealCardText');
        if (p) animateWordReveal(p, { speed: 45 });
      } else if (screenName === 'begin') {
        const sub = document.querySelector('#screen-begin .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'balloonPop') {
        const sub = document.querySelector('#screen-balloonPop .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'makeAWish') {
        const sub = document.querySelector('#screen-makeAWish .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'cake') {
        const sub = document.querySelector('#screen-cake .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'cakeSlice') {
        const sub = document.querySelector('#screen-cakeSlice .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'memories') {
        const sub = document.querySelector('#screen-memories .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'letters') {
        const sub = document.querySelector('#screen-letters .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'cameraReveal') {
        const sub = document.querySelector('#screen-cameraReveal .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'quiz') {
        const sub = document.querySelector('#screen-quiz .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'matchGame') {
        const sub = document.querySelector('#screen-matchGame .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'scratchCard') {
        const sub = document.querySelector('#screen-scratchCard .subtitle-body');
        if (sub) animateWordReveal(sub, { speed: 45 });
      } else if (screenName === 'final') {
        const p = document.querySelector('.finale-message-card p');
        if (p) animateWordReveal(p, { speed: 42 });
      }
    }, 120);
  }

  nextScreen() {
    if (this.currentScreenIndex < this.screens.length - 1) {
      this.showScreen(this.screens[this.currentScreenIndex + 1]);
    }
  }

  // Audio HUD Controls
  setupAudioHUD() {
    const btn = document.getElementById('audioHudBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      audio.toggle();
    });

    audio.onStateChange(isPlaying => {
      if (isPlaying) {
        btn.classList.add('is-playing');
      } else {
        btn.classList.remove('is-playing');
      }
    });
  }

  // Confetti helper using canvas-confetti
  fireConfetti(opts = {}) {
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A3272B', '#E85D7E', '#C9A24B', '#FFD700', '#FFF0F5'],
        ...opts
      });
    }
  }

  // Visual ambient decorations
  setupDecorations() {
    // Sparkle stars generator
    const sparkleContainer = document.getElementById('sparkleContainer');
    if (sparkleContainer) {
      for (let i = 0; i < 18; i++) {
        const star = document.createElement('div');
        star.className = 'sparkle-star';
        star.style.left = `${(i * 37) % 100}%`;
        star.style.top = `${(i * 53) % 100}%`;
        star.style.width = `${3 + (i % 3) * 2}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${(i % 5) * 0.5}s`;
        sparkleContainer.appendChild(star);
      }
    }
  }

  // 1. WELCOME
  setupWelcome() {
    const giftbox = document.getElementById('welcomeGiftbox');
    const btn = document.getElementById('welcomeBtn');
    const handleOpen = () => {
      if (!audio.isPlaying) {
        audio.play().catch(() => {});
      }
      audio.playPop();
      this.fireConfetti({ particleCount: 110, spread: 95, origin: { x: 0.5, y: 0.45 } });
      setTimeout(() => this.showScreen('lock'), 450);
    };

    if (giftbox) giftbox.addEventListener('click', handleOpen);
    if (btn) btn.addEventListener('click', handleOpen);
  }

  // 2. LOCK
  setupLock() {
    const dots = document.querySelectorAll('#pinDots .pin-dot');
    const keys = document.querySelectorAll('.key-btn');
    const lockScreen = document.getElementById('screen-lock');

    const updateDots = () => {
      dots.forEach((dot, idx) => {
        if (idx < this.enteredPin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    };

    keys.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (!key) return;

        if (key === 'del') {
          this.enteredPin = this.enteredPin.slice(0, -1);
          audio.playTap();
          updateDots();
          return;
        }

        if (this.enteredPin.length >= 4) return;
        this.enteredPin += key;
        audio.playTap();
        updateDots();

        if (this.enteredPin.length === 4) {
          if (this.enteredPin === CONFIG.unlockCode) {
            audio.playChime();
            this.fireConfetti({ particleCount: 130, spread: 100, origin: { x: 0.5, y: 0.4 } });
            setTimeout(() => this.showScreen('reveal'), 700);
          } else {
            // Wrong code
            if (lockScreen) lockScreen.classList.add('shake');
            setTimeout(() => {
              if (lockScreen) lockScreen.classList.remove('shake');
              this.enteredPin = '';
              updateDots();
            }, 550);
          }
        }
      });
    });
  }

  // 3. REVEAL
  setupReveal() {
    const btn = document.getElementById('revealBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('begin');
      });
    }
  }

  // 4. BEGIN
  setupBegin() {
    const btn = document.getElementById('beginBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('balloonPop');
      });
    }
  }

  // 5. BALLOON POP (Persistent 4-word message: YOU ARE SO SPECIAL)
  setupBalloons() {
    const balloons = document.querySelectorAll('.balloon-item');
    const counterEl = document.getElementById('balloonCounter');
    const stage = document.getElementById('balloonsStage');
    const continueBtn = document.getElementById('balloonContinueBtn');
    const accumBox = document.getElementById('balloonAccumulatedBox');

    // Exactly four words: YOU, ARE, SO, SPECIAL
    const balloonWords = ["YOU", "ARE", "SO", "SPECIAL"];
    this.balloonStates = [
      { popped: false, word: "YOU" },
      { popped: false, word: "ARE" },
      { popped: false, word: "SO" },
      { popped: false, word: "SPECIAL" }
    ];
    this.poppedBalloonsOrder = [];

    balloons.forEach((bEl, idx) => {
      bEl.addEventListener('click', () => {
        // Prevent double-clicking an already popped balloon
        if (this.balloonStates[idx].popped) return;
        this.balloonStates[idx].popped = true;
        this.poppedBalloonsOrder.push(idx);

        // Play pop sound
        audio.playPop();

        // Believable balloon pop animation
        bEl.classList.add('popping');
        setTimeout(() => {
          bEl.classList.remove('popping');
          bEl.classList.add('popped');
        }, 340);

        // Reveal the assigned word in the persistent accumulated message:
        // After 1st balloon: YOU
        // After 2nd balloon: YOU ARE
        // After 3rd balloon: YOU ARE SO
        // After 4th balloon: YOU ARE SO SPECIAL
        const wordSlotIdx = this.poppedBalloonsOrder.length - 1;
        const targetSlot = document.getElementById(`bWord-${wordSlotIdx}`);
        if (targetSlot) {
          targetSlot.classList.add('revealed');
        }

        // Floating particle word at balloon coordinates for extra delight
        const currentWord = balloonWords[wordSlotIdx] || 'YOU';
        const floatWord = document.createElement('div');
        floatWord.className = 'wish-word-float';
        floatWord.innerText = currentWord;
        floatWord.style.left = bEl.style.left;
        floatWord.style.top = bEl.style.top;
        if (stage) stage.appendChild(floatWord);
        setTimeout(() => floatWord.remove(), 1600);

        // Update counter
        if (counterEl) {
          counterEl.innerText = `${this.poppedBalloonsOrder.length} of 4 popped`;
        }

        // When all 4 are popped: fire celebratory confetti & show continue button
        // CRITICAL: Words NEVER disappear! The complete message stays permanently displayed.
        if (this.poppedBalloonsOrder.length === 4) {
          if (accumBox) accumBox.classList.add('complete');
          this.fireConfetti({ particleCount: 110, spread: 90 });
          if (continueBtn) {
            continueBtn.style.display = 'inline-flex';
          }
        }
      });
    });

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('makeAWish');
      });
    }
  }

  // 6. MAKE A WISH
  setupMakeAWish() {
    const btn = document.getElementById('wishContinueBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('cake');
      });
    }
  }

  // 7. CAKE & CANDLE BLOWING (Vertical Cutting - Change 2)
  setupCake() {
    const cakeStage = document.getElementById('cakeStage');
    const counterEl = document.getElementById('candleCounter');
    const candles = document.querySelectorAll('.cake-candle-point');
    const cutHint = document.getElementById('cakeCutHint');
    const knifeHandle = document.getElementById('knifeSlider');
    const cutTrack = document.getElementById('cakeCutTrack');
    const cakeSplit = document.getElementById('cakeSplitWrapper');
    const seam = document.getElementById('cakeCutSeam');

    this.executeVerticalCut = () => {
      if (this.cakeCut) return;
      this.cakeCut = true;
      audio.playChime();

      // Animate knife and seam all the way down
      if (knifeHandle) knifeHandle.style.top = '78%';
      if (seam) seam.style.height = '78%';

      // Separate the cake into two clean halves along vertical cut
      setTimeout(() => {
        if (cakeSplit) cakeSplit.classList.add('cut-separated');
        this.fireConfetti({ particleCount: 120, spread: 90 });
      }, 250);

      // Transition to cake slice screen after visual separation
      setTimeout(() => {
        if (cutTrack) cutTrack.style.display = 'none';
        if (cutHint) cutHint.style.display = 'none';
        setTimeout(() => this.showScreen('cakeSlice'), 850);
      }, 650);
    };

    const blowCandle = () => {
      if (this.blownCandles >= this.totalCandles) return;
      const candle = candles[this.blownCandles];
      if (candle) {
        const flame = candle.querySelector('.candle-flame');
        if (flame) flame.classList.add('out');

        // Smoke puff
        const smoke = document.createElement('div');
        smoke.className = 'smoke-puff';
        candle.appendChild(smoke);
        setTimeout(() => smoke.remove(), 900);
      }

      this.blownCandles++;
      audio.playPop();

      if (counterEl) {
        counterEl.innerText = `${this.blownCandles} of ${this.totalCandles} blown`;
      }

      if (this.blownCandles === this.totalCandles) {
        if (counterEl) counterEl.innerText = 'Now, drag the knife down to cut the cake!';
        if (cutTrack) cutTrack.style.display = 'flex';
        if (cutHint) {
          cutHint.innerText = 'Drag the knife down to slice the cake! 🍰';
          cutHint.style.display = 'block';
        }
      }
    };

    if (cakeStage) {
      cakeStage.addEventListener('click', e => {
        if (this.blownCandles < this.totalCandles) {
          blowCandle();
        }
      });
    }

    // Vertical knife dragging interaction (FIX 1)
    if (knifeHandle && cutTrack) {
      let isDragging = false;
      let dragStartY = 0;
      let dragPointerId = null;
      let hasDragged = false;

      const onPointerDown = e => {
        if (this.blownCandles < this.totalCandles || this.cakeCut) return;
        if (e.button !== undefined && e.button !== 0) return; // Only primary button

        isDragging = true;
        hasDragged = false;
        dragPointerId = e.pointerId !== undefined ? e.pointerId : null;
        dragStartY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

        knifeHandle.style.transition = 'none';
        if (seam) seam.style.transition = 'none';
        if (dragPointerId !== null) {
          try { knifeHandle.setPointerCapture(dragPointerId); } catch(err) {}
        }

        e.preventDefault();
        e.stopPropagation();
      };

      const onPointerMove = e => {
        if (!isDragging || this.cakeCut) return;
        if (dragPointerId !== null && e.pointerId !== undefined && e.pointerId !== dragPointerId) return;

        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        const totalDeltaY = clientY - dragStartY;

        // Require an intentional downward drag of at least 15px to begin moving the knife
        if (totalDeltaY > 15) {
          hasDragged = true;
        }

        if (!hasDragged) return;

        const rect = cutTrack.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        const pct = progress * 78;

        knifeHandle.style.top = `${pct}%`;
        if (seam) seam.style.height = `${pct}%`;

        // Cut triggers ONLY when:
        // 1. A physical downward drag occurred (totalDeltaY >= 65px)
        // 2. The knife traversed through the cake (pct >= 62% of the cut path)
        if (hasDragged && totalDeltaY >= 65 && pct >= 62 && !this.cakeCut) {
          isDragging = false;
          if (dragPointerId !== null) {
            try { knifeHandle.releasePointerCapture(dragPointerId); } catch(err) {}
          }
          this.executeVerticalCut();
        }
      };

      const onPointerUp = e => {
        if (!isDragging) return;
        isDragging = false;
        if (dragPointerId !== null) {
          try { knifeHandle.releasePointerCapture(dragPointerId); } catch(err) {}
        }
        dragPointerId = null;

        // If the cut was NOT completed (click, tap, or short/accidental drag):
        // Snap the knife and seam smoothly back to the top!
        if (!this.cakeCut) {
          knifeHandle.style.transition = 'top 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1)';
          knifeHandle.style.top = '0%';
          if (seam) {
            seam.style.transition = 'height 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1)';
            seam.style.height = '0%';
          }
          setTimeout(() => {
            if (!this.cakeCut) {
              knifeHandle.style.transition = '';
              if (seam) seam.style.transition = '';
            }
          }, 360);
        }
      };

      // Pointer events for desktop and mobile
      knifeHandle.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // Touch events backup
      knifeHandle.addEventListener('touchstart', onPointerDown, { passive: false });
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
      window.addEventListener('touchcancel', onPointerUp);

      // Explicitly prevent clicking on knife or cutTrack from cutting the cake
      knifeHandle.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
      });
      cutTrack.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
      });
    }

    // Slice continue button
    const sliceBtn = document.getElementById('sliceContinueBtn');
    if (sliceBtn) {
      sliceBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('memories');
      });
    }
  }

  // 9. ALBUMS PHOTO GALLERY (Exactly 10 Independent Photo Slots - Change 3)
  setupMemories() {
    const list = document.getElementById('memoriesList');
    const lightbox = document.getElementById('memoryLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCap = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const continueBtn = document.getElementById('memoriesContinueBtn');

    // Exactly 10 independent photo slots numbered 1 to 10
    const albumItems = (CONFIG.albums && CONFIG.albums.length) ? CONFIG.albums : (CONFIG.memories || []);
    const totalSlots = 10;
    const slotsData = [];

    for (let i = 0; i < totalSlots; i++) {
      const existing = albumItems[i] || {};
      const slotNum = i + 1;
      slotsData.push({
        slot: slotNum,
        src: existing.src || `images/photo${slotNum}.jpg`,
        title: existing.title || `Memory #${slotNum}`,
        subtitle: existing.subtitle || existing.caption || `Unforgettable moment #${slotNum}`,
        tapeColor: existing.tapeColor || (i % 3 === 0 ? 'tape-pink' : (i % 3 === 1 ? 'tape-gold' : 'tape-rose'))
      });
    }

    if (list) {
      list.innerHTML = '';
      slotsData.forEach((mem, idx) => {
        const card = document.createElement('div');
        card.className = 'memory-polaroid';
        card.dataset.slot = String(mem.slot);
        card.style.transform = `rotate(${idx % 2 === 0 ? '-2deg' : '2deg'})`;

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="230" viewBox="0 0 240 230"><rect width="240" height="230" fill="#FFF5F7"/><circle cx="120" cy="95" r="28" fill="#FDE047" fill-opacity="0.35"/><path d="M102 92 L110 82 L130 82 L138 92 L148 92 A6 6 0 0 1 154 98 L154 118 A6 6 0 0 1 148 124 L92 124 A6 6 0 0 1 86 118 L86 98 A6 6 0 0 1 92 92 Z" fill="#C9A24B"/><circle cx="120" cy="108" r="8" fill="#FFF5F7"/><text x="120" y="152" font-family="sans-serif" font-size="13" font-weight="600" fill="#A3272B" text-anchor="middle">Photo Slot #${mem.slot}</text><text x="120" y="172" font-family="sans-serif" font-size="11" fill="#888" text-anchor="middle">Add Image</text></svg>`;
        const fallbackSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

        card.innerHTML = `
          <div class="washi-tape ${mem.tapeColor}"></div>
          <span class="memory-slot-badge">Slot #${mem.slot}</span>
          <img src="${mem.src}" alt="${escapeHtml(mem.title)}">
          <div class="memory-caption-wrap">
            <h4 class="memory-title">${escapeHtml(mem.title)}</h4>
            <p class="memory-subtitle">${escapeHtml(mem.subtitle)}</p>
          </div>
        `;

        const imgEl = card.querySelector('img');
        if (imgEl) {
          imgEl.addEventListener('error', function onImgErr() {
            if (!this.dataset.retried) {
              this.dataset.retried = '1';
              this.src = `assets/photos/photo${mem.slot}.jpg`;
            } else {
              this.removeEventListener('error', onImgErr);
              this.src = fallbackSvg;
            }
          });
        }

        card.addEventListener('click', () => {
          audio.playClick();
          if (lightbox && lightboxImg && lightboxCap) {
            const currentImg = card.querySelector('img');
            lightboxImg.src = currentImg ? currentImg.src : mem.src;
            lightboxCap.innerHTML = `
              <span class="lightbox-caption-title">${escapeHtml(mem.title)}</span>
              <span class="lightbox-caption-desc">${escapeHtml(mem.subtitle)}</span>
            `;
            lightbox.classList.add('active');
          }
        });

        list.appendChild(card);
      });
    }

    if (closeBtn && lightbox) {
      closeBtn.addEventListener('click', () => {
        audio.playClick();
        lightbox.classList.remove('active');
      });
      lightbox.addEventListener('click', e => {
        if (e.target === lightbox) {
          audio.playClick();
          lightbox.classList.remove('active');
        }
      });
    }

    // FIX 2: Reveal navigation button ONLY after scrolling to the bottom of Albums
    this.albumsNavRevealed = false;

    if (continueBtn) {
      continueBtn.style.display = 'none';
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('letters');
      });
    }

    if (list) {
      const checkScrollBottom = () => {
        if (this.albumsNavRevealed) return;

        const scrollRemaining = list.scrollHeight - list.scrollTop - list.clientHeight;
        const slot10 = list.querySelector('.memory-polaroid[data-slot="10"]');
        let slot10InView = false;
        if (slot10) {
          const listRect = list.getBoundingClientRect();
          const cardRect = slot10.getBoundingClientRect();
          slot10InView = cardRect.bottom <= listRect.bottom + 50;
        }

        // Only reveal when user has scrolled down (scrollTop > 100) and reached bottom / viewed slot 10
        if (list.scrollTop > 100 && (scrollRemaining <= 80 || slot10InView)) {
          this.albumsNavRevealed = true;
          if (continueBtn) {
            continueBtn.style.display = 'inline-flex';
            continueBtn.classList.add('btn-pulse');
            if (slot10) {
              setTimeout(() => {
                slot10.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }, 60);
            }
          }
        }
      };

      list.addEventListener('scroll', checkScrollBottom, { passive: true });
      window.addEventListener('resize', checkScrollBottom);
    }
  }

  // 10. LETTERS (Animated 3D Envelope & Word-by-Word Reveal)
  setupLetters() {
    const grid = document.getElementById('lettersGrid');
    const modal = document.getElementById('letterModal');
    const envelopeStage = document.getElementById('modalEnvelope');
    const letterCard = document.getElementById('letterCard');
    const heading = document.getElementById('letterModalHeading');
    const body = document.getElementById('letterModalBody');
    const closeBtn = document.getElementById('letterModalClose');
    const closeXBtn = document.getElementById('letterModalCloseX');
    const counterEl = document.getElementById('lettersCounter');
    const continueBtn = document.getElementById('lettersContinueBtn');

    let wordTimer = null;
    let isAnimatingText = false;
    let currentWordIndex = 0;
    let openTimers = [];

    // Skip word-by-word typing immediately on user click
    const skipTextAnimation = () => {
      if (wordTimer) {
        clearInterval(wordTimer);
        wordTimer = null;
      }
      isAnimatingText = false;
      if (body) {
        const hiddenWords = body.querySelectorAll('.letter-word.hidden');
        hiddenWords.forEach(w => w.classList.remove('hidden'));
      }
    };

    // Animate words one by one in correct reading order
    const animateWords = () => {
      if (!body) return;
      const wordElements = body.querySelectorAll('.letter-word');
      if (wordElements.length === 0) return;

      currentWordIndex = 0;
      isAnimatingText = true;
      if (wordTimer) clearInterval(wordTimer);

      wordTimer = setInterval(() => {
        if (currentWordIndex < wordElements.length) {
          wordElements[currentWordIndex].classList.remove('hidden');
          currentWordIndex++;
        } else {
          clearInterval(wordTimer);
          wordTimer = null;
          isAnimatingText = false;
        }
      }, 65);
    };

    // Open envelope with natural flap rotation, paper slide-out & word reveal
    const openLetter = (item, idx, envEl) => {
      // Clear any pending timers
      openTimers.forEach(t => clearTimeout(t));
      openTimers = [];
      if (wordTimer) { clearInterval(wordTimer); wordTimer = null; }

      // 1. Mark as read & update counter
      this.readLetters.add(idx);
      if (envEl) envEl.classList.add('read');
      if (counterEl) {
        counterEl.innerText = `${this.readLetters.size} of 4 letters read`;
      }
      if (this.readLetters.size === 4 && continueBtn) {
        continueBtn.style.display = 'inline-flex';
      }

      // 2. Prepare text HTML (wrap each word in span.letter-word.hidden)
      if (heading) heading.innerText = item.heading;
      if (body) {
        const paragraphs = item.body.split(/\n+/);
        body.innerHTML = paragraphs.map(p => {
          const words = p.trim().split(/\s+/);
          return words.map(w => `<span class="letter-word hidden">${escapeHtml(w)}</span>`).join(' ');
        }).join('<br><br>');
      }

      // 3. Reset envelope and card animation states
      if (envelopeStage) {
        envelopeStage.classList.remove('flap-open', 'unfolding', 'fully-opened');
      }
      if (modal) modal.classList.add('active');

      // 4. Play romantic paper unfolding & sparkle sound
      audio.playLetterOpen();

      // 5. Sequence: natural flap opening -> paper slide-out -> reading view & word reveal
      openTimers.push(setTimeout(() => {
        if (envelopeStage) envelopeStage.classList.add('flap-open');
      }, 100));

      openTimers.push(setTimeout(() => {
        if (envelopeStage) envelopeStage.classList.add('unfolding');
      }, 550));

      openTimers.push(setTimeout(() => {
        if (envelopeStage) envelopeStage.classList.add('fully-opened');
        animateWords();
      }, 1050));
    };

    // Close letter modal and reset states cleanly
    const closeLetter = () => {
      openTimers.forEach(t => clearTimeout(t));
      openTimers = [];
      skipTextAnimation();
      audio.playClick();
      if (modal) modal.classList.remove('active');
      if (envelopeStage) {
        envelopeStage.classList.remove('flap-open', 'unfolding', 'fully-opened');
      }
    };

    // Clicking the letter card skips the typing animation if running
    if (letterCard) {
      letterCard.addEventListener('click', (e) => {
        if (e.target === closeBtn || e.target === closeXBtn) return;
        if (isAnimatingText) {
          skipTextAnimation();
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLetter);
    if (closeXBtn) closeXBtn.addEventListener('click', closeLetter);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLetter();
      });
    }

    // Populate envelope grid
    if (grid) {
      grid.innerHTML = '';
      CONFIG.letters.forEach((item, idx) => {
        const env = document.createElement('div');
        env.className = 'envelope-item';
        if (this.readLetters.has(idx)) env.classList.add('read');
        env.innerHTML = `
          <div class="envelope-badge">${idx + 1}</div>
          <img src="assets/ref/2df12397a4cb.webp" alt="Letter Envelope">
          <span style="font-family: var(--font-hand); font-size: 0.95rem; margin-top: 4px;">Letter #${idx + 1}</span>
        `;
        env.addEventListener('click', () => {
          openLetter(item, idx, env);
        });
        grid.appendChild(env);
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('cameraReveal');
      });
    }
  }

  // 11. VINTAGE CAMERA
  setupCamera() {
    const cameraWrap = document.getElementById('cameraBodyWrap');
    const flash = document.getElementById('cameraFlash');
    const ejected = document.getElementById('cameraPolaroid');
    const continueBtn = document.getElementById('cameraContinueBtn');

    if (cameraWrap) {
      cameraWrap.addEventListener('click', () => {
        if (this.cameraFired) return;
        this.cameraFired = true;

        audio.playShutter();
        if (flash) {
          flash.classList.add('flashing');
          setTimeout(() => flash.classList.remove('flashing'), 400);
        }

        setTimeout(() => {
          if (ejected) ejected.classList.add('revealed');
          const caption = document.getElementById('cameraPhotoCaption');
          if (caption) caption.classList.add('revealed');
          if (continueBtn) continueBtn.style.display = 'inline-flex';
          this.fireConfetti({ particleCount: 70, spread: 70 });
        }, 500);
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('quiz');
      });
    }
  }

  // 12. BIRTHDAY QUIZ (Exactly 5 Personal Questions)
  setupQuiz() {
    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    const q = CONFIG.quiz[this.quizIndex];
    const qText = document.getElementById('quizQuestionText');
    const optList = document.getElementById('quizOptionsList');
    const progressEl = document.getElementById('quizProgress');

    if (!q || !qText || !optList) return;

    if (progressEl) {
      progressEl.innerText = `Question ${this.quizIndex + 1} of ${CONFIG.quiz.length}`;
    }

    // Animate question text word by word
    qText.innerHTML = '';
    animateWordReveal(qText, { text: q.text, speed: 42 });

    optList.innerHTML = '';

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerText = opt;
      btn.addEventListener('click', () => {
        const isCorrect = idx === q.correctIndex;
        if (isCorrect) {
          btn.classList.add('correct');
          audio.playChime();
          this.quizScore++;
        } else {
          btn.classList.add('wrong');
          audio.playClick();
        }

        // Disable all buttons in this question immediately to prevent duplicate selections
        optList.querySelectorAll('button').forEach(b => b.style.pointerEvents = 'none');

        setTimeout(() => {
          this.quizIndex++;
          if (this.quizIndex < CONFIG.quiz.length) {
            this.renderQuizQuestion();
          } else {
            this.showQuizResult();
          }
        }, 900);
      });
      optList.appendChild(btn);
    });
  }

  showQuizResult() {
    const qCard = document.getElementById('quizCard');
    const resCard = document.getElementById('quizResultCard');
    const scoreText = document.getElementById('quizScoreText');
    const continueBtn = document.getElementById('quizContinueBtn');

    if (qCard) qCard.style.display = 'none';
    if (resCard) resCard.style.display = 'flex';

    if (scoreText) {
      scoreText.innerHTML = '';
      let resultMsg = '';
      if (this.quizScore === CONFIG.quiz.length) {
        resultMsg = `Perfect ${this.quizScore} of ${CONFIG.quiz.length} score! You really know our bond best, Rithi! 🏆`;
        this.fireConfetti({ particleCount: 120, spread: 90 });
      } else if (this.quizScore >= 3) {
        resultMsg = `You scored ${this.quizScore} of ${CONFIG.quiz.length}! Pretty awesome, Rithi! 💛`;
      } else {
        resultMsg = `You scored ${this.quizScore} of ${CONFIG.quiz.length}! Still my favorite sister & best friend! 💛`;
      }
      animateWordReveal(scoreText, { text: resultMsg, speed: 48 });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('matchGame');
      });
    }
  }

  // 13. MATCH GAME
  setupMatchGame() {
    const grid = document.getElementById('matchGrid');
    const movesEl = document.getElementById('matchMovesCount');
    const timerEl = document.getElementById('matchTimerCount');
    const hintBtn = document.getElementById('matchHintBtn');
    const continueBtn = document.getElementById('matchContinueBtn');

    const icons = [
      'assets/ref/9a4e168700de.webp',
      'assets/ref/37250eeea92a.webp',
      'assets/ref/3b2a4d77e7ab.webp',
      'assets/ref/5d471efaba1c.webp',
      'assets/ref/178fba8bd56f.webp',
      'assets/ref/2720b1fd6a3f.webp'
    ];

    // Create 12 cards (6 pairs) shuffled
    let deck = [];
    icons.forEach((src, id) => {
      deck.push({ id, src });
      deck.push({ id, src });
    });
    deck.sort(() => Math.random() - 0.5);

    if (grid) {
      grid.innerHTML = '';
      deck.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.dataset.id = item.id;
        card.dataset.index = idx;
        card.innerHTML = `
          <div class="match-card-face match-card-back">
            <img src="assets/ref/7b9385c0557d.webp" alt="Card Back">
          </div>
          <div class="match-card-face match-card-front">
            <img src="${item.src}" alt="Icon">
          </div>
        `;
        card.addEventListener('click', () => this.handleCardFlip(card, idx, item.id));
        grid.appendChild(card);
        this.matchCards.push(card);
      });
    }

    // Start timer on first card flip
    this.startMatchTimer = () => {
      if (this.matchTimer) return;
      this.matchTimer = setInterval(() => {
        this.matchSeconds++;
        const mins = Math.floor(this.matchSeconds / 60);
        const secs = this.matchSeconds % 60;
        if (timerEl) {
          timerEl.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
      }, 1000);
    };

    // Hint feature
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        if (this.matchHints <= 0) return;
        this.matchHints--;
        audio.playClick();
        hintBtn.innerText = `💡 Hints: ${this.matchHints}`;

        // Find an unmatched pair and briefly reveal them
        const unmatched = this.matchCards.filter(c => !c.classList.contains('matched') && !c.classList.contains('flipped'));
        if (unmatched.length >= 2) {
          const first = unmatched[0];
          const second = unmatched.find(c => c !== first && c.dataset.id === first.dataset.id);
          if (first && second) {
            first.classList.add('flipped');
            second.classList.add('flipped');
            setTimeout(() => {
              if (!first.classList.contains('matched')) first.classList.remove('flipped');
              if (!second.classList.contains('matched')) second.classList.remove('flipped');
            }, 750);
          }
        }
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('scratchCard');
      });
    }
  }

  handleCardFlip(card, idx, id) {
    if (this.flippedIndices.length >= 2) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    this.startMatchTimer();
    audio.playCardFlip();
    card.classList.add('flipped');
    this.flippedIndices.push({ card, idx, id });

    if (this.flippedIndices.length === 2) {
      this.matchMoves++;
      const movesEl = document.getElementById('matchMovesCount');
      if (movesEl) movesEl.innerText = `Moves: ${this.matchMoves}`;

      const [c1, c2] = this.flippedIndices;
      if (c1.id === c2.id) {
        // Matched!
        c1.card.classList.add('matched');
        c2.card.classList.add('matched');
        this.matchedPairs++;
        this.flippedIndices = [];
        audio.playChime();

        if (this.matchedPairs === 6) {
          clearInterval(this.matchTimer);
          this.fireConfetti({ particleCount: 120, spread: 90 });
          const continueBtn = document.getElementById('matchContinueBtn');
          if (continueBtn) continueBtn.style.display = 'inline-flex';
        }
      } else {
        // Not matched -> flip back after 700ms
        setTimeout(() => {
          c1.card.classList.remove('flipped');
          c2.card.classList.remove('flipped');
          this.flippedIndices = [];
        }, 700);
      }
    }
  }

  // 14. SCRATCH CARD
  initScratchCanvas() {
    this.scratchCanvasInit = true;
    const canvas = document.getElementById('scratchCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw metallic rose-crimson foil gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#E85D7E');
    grad.addColorStop(0.5, '#D13A5C');
    grad.addColorStop(1, '#A3272B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative foil stamp patterns
    ctx.fillStyle = 'rgba(255, 250, 240, 0.4)';
    for (let i = 0; i < 28; i++) {
      const x = (i * 97) % canvas.width;
      const y = (i * 53 + 40) % canvas.height;
      ctx.font = '14px Cormorant Garamond, serif';
      ctx.fillText('✨', x, y);
    }

    ctx.font = 'bold 20px Playfair Display, serif';
    ctx.fillStyle = '#FFE7B8';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch Here ❤️', canvas.width / 2, canvas.height / 2);

    const checkRevealed = () => {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 128) transparent++;
      }
      const pct = (transparent / (pixels.length / 4)) * 100;
      if (pct > 40 && !this.scratchRevealed) {
        this.scratchRevealed = true;
        canvas.style.transition = 'opacity 0.6s ease';
        canvas.style.opacity = '0';
        setTimeout(() => {
          canvas.style.display = 'none';
          this.fireConfetti({ particleCount: 110, spread: 90 });
          const continueBtn = document.getElementById('scratchContinueBtn');
          if (continueBtn) continueBtn.style.display = 'inline-flex';
          const secretP = document.querySelector('.scratch-secret-content p');
          if (secretP) animateWordReveal(secretP, { speed: 45 });
        }, 600);
      }
    };

    const scratch = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fill();
      checkRevealed();
    };

    canvas.addEventListener('mousedown', e => { this.isScratching = true; scratch(e.clientX, e.clientY); });
    window.addEventListener('mousemove', e => { if (this.isScratching) scratch(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => { this.isScratching = false; });

    canvas.addEventListener('touchstart', e => {
      this.isScratching = true;
      const t = e.touches[0];
      scratch(t.clientX, t.clientY);
    }, { passive: false });
    window.addEventListener('touchmove', e => {
      if (!this.isScratching) return;
      const t = e.touches[0];
      scratch(t.clientX, t.clientY);
    }, { passive: false });
    window.addEventListener('touchend', () => { this.isScratching = false; });
  }

  setupScratchCard() {
    const continueBtn = document.getElementById('scratchContinueBtn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('final');
      });
    }
  }

  // 15. GRAND FINALE & BIRTHDAY VIDEO (Change 1)
  setupFinal() {
    const finalScreen = document.getElementById('screen-final');
    const replayBtn = document.getElementById('replayBtn');

    // Video modal elements
    const videoModal = document.getElementById('videoModal');
    const birthdayVideo = document.getElementById('birthdayVideo');
    const videoCloseBtn = document.getElementById('videoModalCloseBtn');
    const videoCloseX = document.getElementById('videoModalCloseX');
    const videoReplayBtn = document.getElementById('videoReplayBtn');
    const videoErrorBox = document.getElementById('videoErrorBox');
    const videoRetryBtn = document.getElementById('videoRetryBtn');

    let wasMusicPlayingBeforeVideo = false;

    const openVideo = () => {
      audio.playClick();
      wasMusicPlayingBeforeVideo = audio.isPlaying;
      audio.pause();

      if (videoModal) {
        videoModal.classList.add('active');
        videoModal.style.display = 'flex';
      }

      if (birthdayVideo) {
        if (videoErrorBox) videoErrorBox.style.display = 'none';
        birthdayVideo.style.display = 'block';
        birthdayVideo.currentTime = 0;
        const playPromise = birthdayVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Video auto-play paused/blocked by browser gesture requirement:', err);
          });
        }
      }
    };

    const closeVideo = () => {
      audio.playClick();
      if (birthdayVideo) {
        birthdayVideo.pause();
      }
      if (videoModal) {
        videoModal.classList.remove('active');
        videoModal.style.display = 'none';
      }
      if (wasMusicPlayingBeforeVideo) {
        audio.play().catch(() => {});
      }
    };

    if (birthdayVideo) {
      birthdayVideo.addEventListener('error', () => {
        if (videoErrorBox) videoErrorBox.style.display = 'block';
        birthdayVideo.style.display = 'none';
      });
    }

    if (videoRetryBtn && birthdayVideo) {
      videoRetryBtn.addEventListener('click', () => {
        if (videoErrorBox) videoErrorBox.style.display = 'none';
        birthdayVideo.style.display = 'block';
        birthdayVideo.load();
        birthdayVideo.play().catch(() => {});
      });
    }

    if (videoReplayBtn && birthdayVideo) {
      videoReplayBtn.addEventListener('click', () => {
        audio.playClick();
        birthdayVideo.currentTime = 0;
        birthdayVideo.play().catch(() => {});
      });
    }

    if (videoCloseBtn) videoCloseBtn.addEventListener('click', closeVideo);
    if (videoCloseX) videoCloseX.addEventListener('click', closeVideo);
    if (videoModal) {
      videoModal.addEventListener('click', e => {
        if (e.target === videoModal) closeVideo();
      });
    }

    // Tap anywhere spawns floating hearts
    if (finalScreen) {
      finalScreen.addEventListener('click', e => {
        if (e.target.closest('#replayBtn') || e.target.closest('#videoModal')) return;
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerText = '♥';
        heart.style.left = `${e.clientX}px`;
        heart.style.top = `${e.clientY}px`;
        heart.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1800);
      });
    }

    // Connect existing "✨ Relive the Experience ✨" button to play birthday video
    if (replayBtn) {
      replayBtn.addEventListener('click', openVideo);
    }
  }
}

// Instantiate and start
window.addEventListener('DOMContentLoaded', () => {
  const app = new BirthdayExperience();
  window.app = app;
  app.init();
});
