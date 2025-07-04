<template>
  <div class="immersive-container">
    <div ref="sceneContainer" class="scene-container"></div>

    <div class="custom-cursor" ref="customCursor"></div>
    <div class="cursor-trail" ref="cursorTrail"></div>

    <div class="overlay">
      <header>
        <div class="logo">Liam</div>
        <nav class="nav-menu">
          <ul>
            <li>
              <button @click="navigateHome" class="nav-link">Home</button>
            </li>
            <li><button class="nav-link">Blog</button></li>
            <li><button class="nav-link">Projects</button></li>
            <li><button class="nav-link">Contact</button></li>
          </ul>
        </nav>
      </header>

      <div class="content">
        <h1>Explore The <span class="gradient-text">Digital Frontier</span></h1>
        <p>An interactive journey through code and creativity</p>
        <div class="cta-container">
          <button class="cta-button primary">Discover Projects</button>
          <button class="cta-button secondary">Read Articles</button>
        </div>
      </div>

      <footer>
        <div class="interaction-hints">
          <div class="hint">
            <span class="hint-icon">🖱️</span>
            <span class="hint-text">Move mouse to explore</span>
          </div>
          <div class="hint">
            <span class="hint-icon">👆</span>
            <span class="hint-text">Click for ripple effect</span>
          </div>
          <div class="hint">
            <span class="hint-icon">⚡</span>
            <span class="hint-text">Scroll to interact</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import useImmersiveScene from "~/composables/useImmersiveScene";
import { gsap } from "gsap";

const router = useRouter();
const sceneContainer = ref(null);
let scene = null;
const overlayVisible = ref(true);
const customCursor = ref(null);
const cursorTrail = ref(null);
let cursorTimeout = null;

// Navigate back to home page
const navigateHome = () => {
  // Fade out animation before navigation
  gsap.to(".immersive-container", {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      router.push("/");
    },
  });
};

onMounted(() => {
  // Initialize the 3D scene
  if (sceneContainer.value) {
    scene = useImmersiveScene();
    scene.init(sceneContainer.value);

    // Animate UI elements
    animateUI();

    // Add keyboard event listener for toggling overlay
    window.addEventListener("keydown", handleKeyDown);

    // Initialize custom cursor
    initCustomCursor();
  }
});

onBeforeUnmount(() => {
  // Clean up the 3D scene
  if (scene) {
    scene.cleanup();
  }
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mousedown", handleMouseDown);
  window.removeEventListener("mouseup", handleMouseUp);

  if (cursorTimeout) {
    clearTimeout(cursorTimeout);
  }
});

const handleKeyDown = (event) => {
  // Toggle overlay visibility with 'H' key
  if (event.key === "h" || event.key === "H") {
    toggleOverlay();
  }
};

const toggleOverlay = () => {
  overlayVisible.value = !overlayVisible.value;

  if (overlayVisible.value) {
    gsap.to(".overlay", {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    });
  } else {
    gsap.to(".overlay", {
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  }
};

// Custom cursor implementation
const initCustomCursor = () => {
  if (!customCursor.value || !cursorTrail.value) return;

  // Hide default cursor
  document.body.style.cursor = "none";

  // Add event listeners
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);

  // Initial position off-screen
  gsap.set(customCursor.value, { x: -100, y: -100 });
  gsap.set(cursorTrail.value, { x: -100, y: -100 });
};

const handleMouseMove = (e) => {
  // Show cursor if it was hidden
  gsap.to(customCursor.value, {
    opacity: 1,
    duration: 0.3,
  });
  gsap.to(cursorTrail.value, {
    opacity: 0.5,
    duration: 0.3,
  });

  // Clear previous timeout
  if (cursorTimeout) {
    clearTimeout(cursorTimeout);
  }

  // Set timeout to hide cursor after 2 seconds of inactivity
  cursorTimeout = setTimeout(() => {
    gsap.to([customCursor.value, cursorTrail.value], {
      opacity: 0,
      duration: 0.8,
    });
  }, 2000);

  // Move main cursor to mouse position
  gsap.to(customCursor.value, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.1,
  });

  // Move trail with slight delay for trailing effect
  gsap.to(cursorTrail.value, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.5,
  });
};

const handleMouseDown = () => {
  // Scale down cursor on click
  gsap.to(customCursor.value, {
    scale: 0.7,
    duration: 0.2,
  });

  // Expand trail on click
  gsap.to(cursorTrail.value, {
    scale: 1.5,
    opacity: 0.7,
    duration: 0.3,
  });
};

const handleMouseUp = () => {
  // Return cursor to normal size
  gsap.to(customCursor.value, {
    scale: 1,
    duration: 0.2,
  });

  // Return trail to normal
  gsap.to(cursorTrail.value, {
    scale: 1,
    opacity: 0.5,
    duration: 0.3,
  });
};

// Animate UI elements with GSAP
const animateUI = () => {
  // Initial state - all elements invisible
  gsap.set(["header", ".content", "footer"], { opacity: 0 });

  // Create a timeline for sequential animations
  const tl = gsap.timeline({ delay: 1 }); // Delay to allow 3D scene to initialize

  // Animate header
  tl.from("header", {
    y: -50,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",
  });

  // Animate logo and nav separately for staggered effect
  tl.from(
    ".logo",
    {
      x: -30,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.7)",
    },
    "-=0.8"
  );

  tl.from(
    ".nav-link",
    {
      y: -20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
    },
    "-=0.5"
  );

  // Animate content elements
  tl.from(
    ".content h1",
    {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    },
    "-=0.3"
  );

  tl.from(
    ".content p",
    {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
    },
    "-=0.6"
  );

  tl.from(
    ".cta-button",
    {
      y: 20,
      opacity: 0,
      stagger: 0.15,
      duration: 0.7,
      ease: "back.out(1.4)",
    },
    "-=0.4"
  );

  // Animate footer
  tl.from(
    ".hint",
    {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
    },
    "-=0.2"
  );

  // Add subtle hover animations for buttons
  const buttons = document.querySelectorAll(".cta-button, .nav-link");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: "power1.out",
      });
    });

    button.addEventListener("mouseleave", () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: "power1.out",
      });
    });
  });
};
</script>

<style scoped>
.immersive-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000814;
  color: white;
  overflow: hidden;
  cursor: none; /* Hide default cursor */
}

.scene-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Custom cursor styles */
.custom-cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid rgba(0, 242, 254, 0.8);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.5);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  mix-blend-mode: difference;
}

.cursor-trail {
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(179, 71, 234, 0.1);
  box-shadow: 0 0 20px rgba(179, 71, 234, 0.3);
  pointer-events: none;
  z-index: 9998;
  transform: translate(-50%, -50%);
  opacity: 0.5;
}

.overlay {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  padding: 2rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: auto;
  padding: 1rem 2rem;
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: calc(100% - 4rem);
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(to right, #00f2fe, #4facfe, #b347ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
  letter-spacing: 1px;
}

.nav-menu ul {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-link {
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  padding: 0.5rem 0;
  transition: all 0.3s ease;
}

.nav-link::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(to right, #00f2fe, #b347ea);
  transition: width 0.3s ease;
}

.nav-link:hover {
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.nav-link:hover::after {
  width: 100%;
}

.content {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  pointer-events: auto;
  padding: 2rem;
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.content h1 {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.gradient-text {
  background: linear-gradient(to right, #00f2fe, #4facfe, #b347ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}

.gradient-text::after {
  content: "Digital Frontier";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-text-fill-color: transparent;
  filter: blur(8px);
  opacity: 0.5;
  z-index: -1;
}

.content p {
  font-size: 1.4rem;
  opacity: 0.9;
  margin-bottom: 2.5rem;
  font-weight: 300;
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
}

.cta-container {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.cta-button {
  padding: 0.8rem 1.8rem;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  z-index: -1;
  background: linear-gradient(45deg, #00f2fe, #4facfe, #b347ea, #00f2fe);
  background-size: 400%;
  border-radius: 30px;
  animation: gradientBorder 3s linear infinite;
}

@keyframes gradientBorder {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.cta-button.primary {
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: white;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
}

.cta-button.secondary {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
}

.cta-button.primary:hover {
  box-shadow: 0 7px 20px rgba(79, 172, 254, 0.5);
}

footer {
  width: 100%;
  pointer-events: auto;
}

.interaction-hints {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem 2rem;
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
  margin: 0 auto;
}

.hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.hint:hover {
  opacity: 1;
}

.hint-icon {
  font-size: 1.2rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .nav-menu ul {
    gap: 1rem;
  }

  .content h1 {
    font-size: 2.5rem;
  }

  .content p {
    font-size: 1.1rem;
  }

  .cta-container {
    flex-direction: column;
    gap: 1rem;
  }

  .interaction-hints {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
}

/* Animation for floating elements */
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.content {
  animation: float 6s ease-in-out infinite;
}
</style>
