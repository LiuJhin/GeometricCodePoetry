import * as THREE from 'three';

export default function useThreeBackground() {
  // Three.js variables
  let scene, camera, renderer, clock;
  let particles, mouseX = 0, mouseY = 0;
  let windowHalfX, windowHalfY;
  let animationFrameId = null;
  
  // Initialize Three.js scene
  const init = (container) => {
    if (!container) return;
    
    // Set up scene
    scene = new THREE.Scene();
    
    // Set up camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 2000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 1000;
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Set up clock for animations
    clock = new THREE.Clock();
    
    // Create particles
    createParticles();
    
    // Set window dimensions for mouse tracking
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
    
    return { scene, camera, renderer };
  };
  
  // Create particle system
  const createParticles = () => {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const colorPalette = [
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0xff00ff), // Magenta
      new THREE.Color(0x0000ff), // Blue
      new THREE.Color(0x00ff00)  // Green
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // Positions - random in a 3D space
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Random size
      sizes[i] = Math.random() * 10;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Shader material for particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Add some movement
          float angle = time * 0.2 + position.x * 0.01 + position.y * 0.01;
          pos.x += sin(angle) * 10.0;
          pos.y += cos(angle) * 10.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Create a circular particle
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft edge
          float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
  };
  
  // Handle mouse movement
  const onMouseMove = (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
  };
  
  // Handle window resize
  const onWindowResize = () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  
  // Animation loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Update particle material time uniform
    if (particles && particles.material.uniforms) {
      particles.material.uniforms.time.value = elapsedTime;
    }
    
    // Rotate particles based on mouse position
    if (particles) {
      particles.rotation.x += (mouseY - particles.rotation.x) * 0.01;
      particles.rotation.y += (mouseX - particles.rotation.y) * 0.01;
    }
    
    renderer.render(scene, camera);
  };
  
  // Clean up resources
  const cleanup = () => {
    // Clean up event listeners
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onWindowResize);
    
    // Stop animation loop
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Dispose of Three.js resources
    if (particles) {
      particles.geometry.dispose();
      particles.material.dispose();
      scene.remove(particles);
    }
    
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      try {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      } catch (e) {
        console.warn('Error removing renderer DOM element:', e.message);
        // DOM元素可能已经被移除，继续执行清理
      }
      renderer.dispose();
    }
  };
  
  return {
    init,
    cleanup
  };
}