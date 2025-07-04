<template>
  <div class="home-container">
    <!-- Content Overlay -->
    <div class="content-overlay">
      <header class="header">
        <div class="logo">
          <h1 class="site-title">LIAM.DEV</h1>
        </div>
        <nav class="navigation">
          <ul>
            <li><a href="#about" class="nav-link">About</a></li>
            <li><a href="#articles" class="nav-link">Articles</a></li>
            <li><a href="#projects" class="nav-link">Projects</a></li>
            <li><a href="#contact" class="nav-link">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <!-- Hero Section with 3D Canvas -->
        <section class="hero-section">
          <!-- 3D Background Canvas -->
          <div ref="canvasContainer" class="canvas-container"></div>
          
          <div class="hero-content">
            <h2 class="hero-title">Exploring the <span class="gradient-text">Future</span> of Web</h2>
            <p class="hero-subtitle">Front-end developer & creative technologist</p>
            <div class="hero-buttons">
              <button class="cta-button">Explore My Work</button>
              <NuxtLink to="/immersive" class="immersive-button">Experience 3D Demo</NuxtLink>
            </div>
          </div>
        </section>

        <!-- About Section -->
        <section id="about" class="section about-section">
          <h2 class="section-title">About Me</h2>
          <div class="section-content">
            <p>I'm a front-end developer passionate about creating immersive digital experiences that blend technology and art. With expertise in modern JavaScript frameworks and 3D web technologies, I build websites that push the boundaries of what's possible on the web.</p>
            <div class="skills">
              <div class="skill-tag">JavaScript</div>
              <div class="skill-tag">Vue.js</div>
              <div class="skill-tag">Three.js</div>
              <div class="skill-tag">GSAP</div>
              <div class="skill-tag">WebGL</div>
            </div>
          </div>
        </section>

        <!-- Articles Section -->
        <section id="articles" class="section articles-section">
          <h2 class="section-title">Latest Articles</h2>
          <div class="articles-grid">
            <div class="article-card">
              <div class="article-date">June 15, 2025</div>
              <h3 class="article-title">Creating Immersive 3D Experiences with Three.js</h3>
              <p class="article-excerpt">Learn how to build captivating 3D scenes that respond to user interaction.</p>
              <a href="#" class="read-more">Read More</a>
            </div>
            <div class="article-card">
              <div class="article-date">May 28, 2025</div>
              <h3 class="article-title">Advanced Animation Techniques with GSAP</h3>
              <p class="article-excerpt">Discover powerful animation strategies to bring your web projects to life.</p>
              <a href="#" class="read-more">Read More</a>
            </div>
            <div class="article-card">
              <div class="article-date">April 10, 2025</div>
              <h3 class="article-title">The Future of Web Design: Trends to Watch</h3>
              <p class="article-excerpt">Exploring emerging technologies and design patterns shaping tomorrow's web.</p>
              <a href="#" class="read-more">Read More</a>
            </div>
          </div>
        </section>

        <!-- Projects Section -->
        <section id="projects" class="section projects-section">
          <h2 class="section-title">Featured Projects</h2>
          <div class="projects-grid">
            <div class="project-card">
              <div class="project-image"></div>
              <h3 class="project-title">Nebula Explorer</h3>
              <p class="project-description">An interactive 3D visualization of cosmic nebulae using WebGL and particle systems.</p>
              <div class="project-tags">
                <span>Three.js</span>
                <span>WebGL</span>
                <span>GSAP</span>
              </div>
              <a href="#" class="view-project">View Project</a>
            </div>
            <div class="project-card">
              <div class="project-image"></div>
              <h3 class="project-title">Waveform Synthesizer</h3>
              <p class="project-description">A browser-based audio synthesizer with visual waveform representation.</p>
              <div class="project-tags">
                <span>Web Audio API</span>
                <span>Canvas</span>
                <span>Vue.js</span>
              </div>
              <a href="#" class="view-project">View Project</a>
            </div>
            <div class="project-card">
              <div class="project-image"></div>
              <h3 class="project-title">Digital Garden</h3>
              <p class="project-description">Procedurally generated botanical forms that grow and evolve based on user interaction.</p>
              <div class="project-tags">
                <span>Three.js</span>
                <span>Procedural Generation</span>
                <span>GLSL</span>
              </div>
              <a href="#" class="view-project">View Project</a>
            </div>
          </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="section contact-section">
          <h2 class="section-title">Get In Touch</h2>
          <div class="contact-content">
            <p>Interested in working together or have a question? Feel free to reach out!</p>
            <form class="contact-form">
              <div class="form-group">
                <input type="text" placeholder="Your Name" class="form-input" />
              </div>
              <div class="form-group">
                <input type="email" placeholder="Your Email" class="form-input" />
              </div>
              <div class="form-group">
                <textarea placeholder="Your Message" class="form-textarea"></textarea>
              </div>
              <button type="submit" class="submit-button">Send Message</button>
            </form>
            <div class="social-links">
              <a href="#" class="social-link">Twitter</a>
              <a href="#" class="social-link">GitHub</a>
              <a href="#" class="social-link">LinkedIn</a>
              <a href="#" class="social-link">CodePen</a>
            </div>
          </div>
        </section>
      </main>

      <footer class="footer">
        <p>&copy; 2025 LIAM.DEV. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import useGeometryScene from '~/composables/useGeometryScene';
import useGSAPAnimations from '~/composables/useGSAPAnimations';

// Refs
const canvasContainer = ref(null);

// Composables
const geometryScene = useGeometryScene();
const gsapAnimations = useGSAPAnimations();

// Lifecycle hooks
onMounted(() => {
  // Initialize Three.js geometry scene
  if (canvasContainer.value) {
    geometryScene.init(canvasContainer.value);
  }
  
  // Initialize GSAP animations
  gsapAnimations.initAnimations();
});

onUnmounted(() => {
  // Clean up Three.js resources
  geometryScene.cleanup();
  
  // Clean up GSAP animations
  gsapAnimations.cleanup();
});
</script>

<style>
/* Canvas Container */
.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* Content Overlay */
.content-overlay {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 5%;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  backdrop-filter: blur(5px);
  background-color: rgba(5, 5, 5, 0.5);
}

.site-title {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navigation ul {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 1px;
  position: relative;
  transition: color 0.3s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: #00ffff;
}

.nav-link:hover::after {
  width: 100%;
}

/* Hero Section */
.hero-section {
  height: 100vh;
  display: flex;
  align-items: center;
  padding: 0 10%;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 400;
  color: #aaaaaa;
  margin-bottom: 2.5rem;
}

.hero-buttons {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.cta-button {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  border: none;
  color: #050505;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 30px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.cta-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
}

.immersive-button {
  background: transparent;
  border: 2px solid #00ffff;
  color: #00ffff;
  padding: 0.9rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 30px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
}

.immersive-button:hover {
  background: rgba(0, 255, 255, 0.1);
  transform: translateY(-5px);
  box-shadow: 0 0 25px rgba(0, 255, 255, 0.4);
}

/* Sections */
.section {
  padding: 8rem 10%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
}

/* About Section */
.about-section .section-content {
  max-width: 800px;
  font-size: 1.2rem;
  line-height: 1.8;
  color: #cccccc;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.skill-tag {
  background-color: rgba(0, 255, 255, 0.1);
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.skill-tag:hover {
  background-color: rgba(0, 255, 255, 0.2);
  transform: translateY(-3px);
}

/* Articles Section */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.article-card {
  background-color: rgba(20, 20, 20, 0.5);
  border: 1px solid #333;
  border-radius: 10px;
  padding: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.article-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0, 255, 255, 0.1);
  border-color: #00ffff;
}

.article-date {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.article-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.article-excerpt {
  color: #aaa;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.read-more {
  color: #00ffff;
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  position: relative;
}

.read-more::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #00ffff;
  transition: width 0.3s ease;
}

.read-more:hover::after {
  width: 100%;
}

/* Projects Section */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2.5rem;
}

.project-card {
  background-color: rgba(20, 20, 20, 0.5);
  border: 1px solid #333;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(255, 0, 255, 0.1);
  border-color: #ff00ff;
}

.project-image {
  height: 200px;
  background-color: #111;
  position: relative;
  overflow: hidden;
}

.project-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
  z-index: 1;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 600;
  padding: 1.5rem 1.5rem 0.5rem;
}

.project-description {
  color: #aaa;
  padding: 0 1.5rem 1rem;
  line-height: 1.6;
}

.project-tags {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-tags span {
  background-color: rgba(255, 0, 255, 0.1);
  border: 1px solid #ff00ff;
  color: #ff00ff;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.view-project {
  display: block;
  text-align: center;
  background-color: rgba(255, 0, 255, 0.1);
  color: #ff00ff;
  text-decoration: none;
  padding: 1rem;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.view-project:hover {
  background-color: rgba(255, 0, 255, 0.2);
}

/* Contact Section */
.contact-content {
  max-width: 800px;
  font-size: 1.2rem;
  line-height: 1.8;
  color: #cccccc;
}

.contact-form {
  margin-top: 2rem;
  display: grid;
  gap: 1.5rem;
}

.form-input, .form-textarea {
  width: 100%;
  background-color: rgba(30, 30, 30, 0.5);
  border: 1px solid #333;
  border-radius: 5px;
  padding: 1rem;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-textarea {
  min-height: 150px;
  resize: vertical;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
}

.submit-button {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  border: none;
  color: #050505;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  justify-self: start;
}

.submit-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 0, 255, 0.3);
}

.social-links {
  display: flex;
  gap: 1.5rem;
  margin-top: 3rem;
}

.social-link {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.social-link:hover {
  color: #00ffff;
}

/* Footer */
.footer {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 0.9rem;
}

/* Media Queries */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    padding: 1.5rem 5%;
  }
  
  .navigation ul {
    margin-top: 1rem;
    gap: 1rem;
  }
  
  .hero-title {
    font-size: 3rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .section {
    padding: 6rem 5%;
  }
  
  .articles-grid, .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>