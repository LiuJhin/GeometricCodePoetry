import * as THREE from 'three';
import { gsap } from 'gsap';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function useImmersiveScene() {
  // Three.js variables
  let scene, camera, renderer, clock, controls;
  let neonLines;
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  let windowHalfX, windowHalfY;
  let animationFrameId = null;
  let scrollY = 0;
  let rippleStrength = 0;
  let bgScene, bgCamera, bgMesh;
  let sceneContainer;
  
  // Initialize Three.js scene
  const init = (container) => {
    if (!container) return;
    
    // Store container reference globally
    sceneContainer = container;
    
    // Set up scene
    scene = new THREE.Scene();
    
    // 使用纯黑色背景
    scene.background = new THREE.Color(0x000000);
    
    // 添加环境光提供基础亮度
    const ambientLight = new THREE.AmbientLight(0x333333); // 柔和的环境光
    scene.add(ambientLight);
    
    // 添加半球光模拟环境反射
    const hemisphereLight = new THREE.HemisphereLight(0x6666ff, 0x002244, 0.5);
    scene.add(hemisphereLight);
    
    // Set up camera
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 2000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 50;
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Set up controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Set up clock for animations
    clock = new THREE.Clock();
    
    // 只创建线条
    createNeonLines();
    
    // Set window dimensions for mouse tracking
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', onScroll);
    container.addEventListener('click', onSceneClick);
    
    // Start animation loop
    animate();
    
    // Initial camera animation
    animateCamera();
    
    return { scene, camera, renderer };
  };
  
  // Create starfield background
  const createStarField = () => {
    const starCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    // Create stars at different depths for parallax effect
    for (let i = 0; i < starCount; i++) {
      // Position stars in a large sphere around the scene
      const radius = 100 + Math.random() * 900; // Far away stars
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Star colors - mostly white/blue with occasional color
      const colorChoice = Math.random();
      if (colorChoice > 0.9) {
        // Occasional colored stars
        colors[i * 3] = 0.8 + Math.random() * 0.2; // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = Math.random() * 0.5; // B - yellowish
      } else if (colorChoice > 0.8) {
        // Blue-ish stars
        colors[i * 3] = Math.random() * 0.5; // R
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.5; // G
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
      } else {
        // White/blue-ish stars
        const brightness = 0.8 + Math.random() * 0.2;
        colors[i * 3] = brightness * (0.7 + Math.random() * 0.3); // R
        colors[i * 3 + 1] = brightness * (0.8 + Math.random() * 0.2); // G
        colors[i * 3 + 2] = brightness; // B
      }
      
      // Random sizes - mostly small
      sizes[i] = Math.random() * 1.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Shader material for stars with twinkle effect
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
          
          // Calculate position with very subtle movement
          vec3 pos = position;
          
          // Twinkle effect - different for each star
          float twinkle = sin(time * (0.5 + fract(position.x * position.y * position.z) * 2.0));
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (0.8 + twinkle * 0.2) * pixelRatio * (800.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular point with soft edge
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Softer edge for glow effect
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    starField = new THREE.Points(geometry, material);
    scene.add(starField);
  };
  
  // Create glowing particles
  const createParticles = () => {
    const particleCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const colorPalette = [
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0x9900ff), // Purple
      new THREE.Color(0x0033ff), // Deep blue
      new THREE.Color(0xff00ff)  // Magenta
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // Create particles in layers for better depth effect
      let x, y, z;
      
      // Distribute particles in different patterns
      const distribution = Math.random();
      
      if (distribution < 0.7) {
        // Most particles in a sphere around the center
        const radius = 20 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);
      } else if (distribution < 0.9) {
        // Some particles in a disc shape
        const radius = 30 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        
        x = radius * Math.cos(theta);
        y = radius * Math.sin(theta);
        z = (Math.random() - 0.5) * 20; // Thin disc
      } else {
        // A few particles in streams/jets
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 70;
        
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        z = (Math.random() - 0.5) * 120; // Longer in z-direction
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Varied sizes with more small particles
      sizes[i] = Math.pow(Math.random(), 2) * 3.5;
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
          
          // Add more complex movement
          float uniqueSpeed = fract(sin(dot(vec3(position.x, position.y, position.z), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          float angle = time * (0.05 + uniqueSpeed * 0.1) + position.x * 0.01 + position.y * 0.01;
          
          // Different movement patterns based on particle position
          float dist = length(position.xy);
          float moveFactor = 0.8 + sin(dist * 0.05 + time * 0.2) * 0.2;
          
          pos.x += sin(angle) * moveFactor;
          pos.y += cos(angle) * moveFactor;
          pos.z += sin(angle * 0.5) * moveFactor;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Create a circular particle with glow
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft edge with glow
          float glow = 0.3 * (1.0 - dist * 2.0);
          float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
          
          gl_FragColor = vec4(vColor * (1.0 + glow), alpha);
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
  
  // Create central organic blob with noise distortion
  const createCentralBlob = () => {
    // Create a sphere geometry with high detail
    const geometry = new THREE.IcosahedronGeometry(10, 24);
    
    // Store original positions for noise distortion
    const positionAttribute = geometry.getAttribute('position');
    const originalPositions = [];
    for (let i = 0; i < positionAttribute.count; i++) {
      originalPositions.push(new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      ));
    }
    
    // Create shader material with noise distortion
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x9900ff) }, // Purple
        color2: { value: new THREE.Color(0x00ffff) }  // Cyan
      },
      vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          // First corner
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          // Permutations
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                  
          // Gradients: 7x7 points over a square, mapped onto an octahedron.
          float n_ = 0.142857142857; // 1.0/7.0
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          // Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vNormal = normal;
          vPosition = position;
          
          // Apply more complex noise distortion
          float noise1 = snoise(position * 0.2 + time * 0.1) * 0.5 + 0.5;
          float noise2 = snoise(position * 0.4 - time * 0.15) * 0.5 + 0.5;
          float noise3 = snoise(position * 0.1 + time * 0.05) * 0.5 + 0.5;
          
          // Combine noise patterns
          float combinedNoise = noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1;
          
          // Add ripple effect based on external factor (scroll or click)
          float ripple = sin(length(position) * 2.0 - time * 3.0) * rippleStrength;
          
          vec3 newPosition = position * (1.0 + combinedNoise * 0.25 + ripple);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // More complex gradient with multiple patterns
          float pattern1 = sin(vPosition.x * 0.05 + vPosition.y * 0.05 + vPosition.z * 0.05 + time * 0.2) * 0.5 + 0.5;
          float pattern2 = cos(vPosition.x * 0.1 - vPosition.y * 0.1 + time * 0.15) * 0.5 + 0.5;
          float pattern3 = sin(length(vPosition) * 0.1 - time * 0.3) * 0.5 + 0.5;
          
          // Combine patterns
          float gradient = pattern1 * 0.6 + pattern2 * 0.3 + pattern3 * 0.1;
          
          // Mix colors with more variation
          vec3 color3 = vec3(0.5, 0.0, 1.0); // Deep purple
          vec3 tempColor = mix(color1, color2, gradient);
          vec3 finalColor = mix(tempColor, color3, pattern3 * 0.5);
          
          // Add rim lighting
          vec3 viewDirection = normalize(-vPosition);
          float rimFactor = 1.0 - max(0.0, dot(vNormal, viewDirection));
          rimFactor = pow(rimFactor, 3.0);
          
          finalColor += rimFactor * 0.5;
          
          // Add pulsing glow
          float glow = sin(time) * 0.1 + 0.3;
          float pulse = sin(time * 0.5) * 0.1 + 0.9;
          
          // Add ripple highlight
          float rippleHighlight = max(0.0, sin(length(vPosition) * 2.0 - time * 3.0) * rippleStrength * 2.0);
          
          gl_FragColor = vec4(finalColor * pulse + vec3(rippleHighlight), 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    centralBlob = new THREE.Mesh(geometry, material);
    scene.add(centralBlob);
    
    // Store original positions for animation
    centralBlob.userData.originalPositions = originalPositions;
  };
  
  // 创建更多线条
  const createNeonLines = () => {
    const lineCount = 300; // 增加线条数量
    const lineGroup = new THREE.Group();
    
    const colorPalette = [
      new THREE.Color(0xffffff), // 白色
      new THREE.Color(0x00ffff), // 青色
      new THREE.Color(0x9900ff), // 紫色
      new THREE.Color(0xff00ff)  // 品红
    ];
    
    // 添加灯光轨道，照射到屏幕中间
    const createLightTrack = () => {
      // 创建一个指向屏幕中心的灯光轨道
      const trackPoints = [];
      const segments = 100;
      
      // 创建一个从远处指向中心的曲线
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // 起点在远处，终点在中心
        const x = (1 - t) * 100 * (Math.random() * 0.4 + 0.8); // 从远处开始
        const y = (1 - t) * 50 * (Math.random() * 0.4 + 0.8); // 从上方开始
        const z = (1 - t) * -150; // 从后方开始
        
        // 添加一些波动
        const waveX = Math.sin(t * Math.PI * 4) * 5 * (1 - t);
        const waveY = Math.cos(t * Math.PI * 3) * 5 * (1 - t);
        
        trackPoints.push(new THREE.Vector3(x + waveX, y + waveY, z));
      }
      
      const trackCurve = new THREE.CatmullRomCurve3(trackPoints);
      const trackGeometry = new THREE.TubeGeometry(trackCurve, 100, 0.8, 8, false);
      
      // 创建更亮的发光材质
      const trackMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9, // 增加不透明度
        side: THREE.DoubleSide,
        emissive: 0xffffff, // 添加自发光
        emissiveIntensity: 1.0 // 自发光强度
      });
      
      // 添加辅助光源沿着轨道
      const trackLight = new THREE.PointLight(0xffffff, 1, 30);
      trackLight.position.set(trackPoints[Math.floor(trackPoints.length/2)].x, 
                             trackPoints[Math.floor(trackPoints.length/2)].y, 
                             trackPoints[Math.floor(trackPoints.length/2)].z);
      scene.add(trackLight);
      
      const lightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
      
      // 添加沿轨道移动的光点
      const lightPointGeometry = new THREE.SphereGeometry(2, 16, 16);
      const lightPointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      
      const lightPoint = new THREE.Mesh(lightPointGeometry, lightPointMaterial);
      lightPoint.userData.trackCurve = trackCurve;
      lightPoint.userData.trackTime = 0;
      lightPoint.userData.speed = 0.2 + Math.random() * 0.3;
      
      // 添加光晕
      const glowGeometry = new THREE.SphereGeometry(4, 16, 16);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0xffffff) }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
            gl_FragColor = vec4(glowColor, 1.0) * intensity;
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      lightPoint.add(glow);
      
      // 添加聚光灯，照射到中心 - 增强亮度
      const spotLight = new THREE.SpotLight(0xffffff, 5, 300, Math.PI / 6, 0.5, 1); // 增加强度和距离
      spotLight.position.set(0, 0, 0);
      spotLight.target.position.set(0, 0, 0); // 目标是场景中心
      lightPoint.add(spotLight);
      lightPoint.add(spotLight.target);
      
      // 添加点光源增强光效
      const pointLight = new THREE.PointLight(0xffffff, 2, 50);
      pointLight.position.set(0, 0, 0);
      lightPoint.add(pointLight);
      
      // 将光点添加到场景
      scene.add(lightPoint);
      scene.add(lightTrack);
      
      return { lightTrack, lightPoint };
    };
    
    // 创建3个灯光轨道
    const lightTracks = [];
    for (let i = 0; i < 3; i++) {
      lightTracks.push(createLightTrack());
    }
    
    // 将灯光轨道添加到userData中，以便在动画循环中更新
    lineGroup.userData.lightTracks = lightTracks;
    
    for (let i = 0; i < lineCount; i++) {
      // 创建更多变化的曲线路径
      let curve;
      
      // 不同类型的曲线
      const curveType = Math.random();
      
      if (curveType < 0.4) {
        // 标准曲线
        curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30),
          new THREE.Vector3(Math.random() * 80 - 40, Math.random() * 80 - 40, Math.random() * 80 - 40),
          new THREE.Vector3(Math.random() * 80 - 40, Math.random() * 80 - 40, Math.random() * 80 - 40),
          new THREE.Vector3(Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30)
        );
      } else if (curveType < 0.7) {
        // 轨道路径
        const radius = 15 + Math.random() * 35;
        const points = [];
        const segments = 60; // 增加分段数
        
        for (let j = 0; j <= segments; j++) {
          const theta = (j / segments) * Math.PI * 2;
          const phi = Math.random() * Math.PI * 0.5;
          
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.sin(phi) * Math.sin(theta);
          const z = radius * Math.cos(phi) + (Math.random() - 0.5) * 15;
          
          points.push(new THREE.Vector3(x, y, z));
        }
        
        curve = new THREE.CatmullRomCurve3(points);
      } else {
        // 螺旋路径
        const points = [];
        const turns = 2 + Math.random() * 4;
        const segments = 60;
        const radius = 5 + Math.random() * 30;
        const height = Math.random() * 60 - 30;
        
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const angle = t * Math.PI * 2 * turns;
          const r = t * radius;
          
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          const z = height * (t - 0.5);
          
          points.push(new THREE.Vector3(x, y, z));
        }
        
        curve = new THREE.CatmullRomCurve3(points);
      }
      
      const points = curve.getPoints(60); // 增加点的数量
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // 创建线条材质
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      
      // 使用LineBasicMaterial，增加线条可见度
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: false, // 不透明
        opacity: 1.0, // 完全不透明
        linewidth: 1.5 // 增加线宽（注意：在WebGL中，线宽受限制）
      });
      
      const line = new THREE.Line(geometry, material);
      line.userData.originalPoints = points.map(p => p.clone());
      line.userData.speed = Math.random() * 0.5 + 0.5;
      
      lineGroup.add(line);
    }
    
    neonLines = lineGroup;
    scene.add(neonLines);
  };
  
  // Handle mouse movement
  const onMouseMove = (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Smooth target values for camera movement
    targetX = mouseX * 5;
    targetY = mouseY * 5;
    
    // Update particles based on mouse position
    if (particles && particles.material.uniforms) {
      particles.material.uniforms.mousePosition = { value: new THREE.Vector2(mouseX, mouseY) };
    }
  };
  
  // Handle scroll events
  const onScroll = () => {
    scrollY = window.scrollY;
    
    // Trigger ripple effect on scroll
    gsap.to({ value: 0 }, {
      value: 0.3,
      duration: 1,
      ease: 'power2.out',
      onUpdate: function() {
        rippleStrength = this.targets()[0].value;
      },
      onComplete: function() {
        gsap.to({ value: rippleStrength }, {
          value: 0,
          duration: 1.5,
          ease: 'power2.in',
          onUpdate: function() {
            rippleStrength = this.targets()[0].value;
          }
        });
      }
    });
  };
  
  // Handle click on scene
  const onSceneClick = (event) => {
    // Trigger stronger ripple effect on click
    gsap.to({ value: 0 }, {
      value: 0.5,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: function() {
        rippleStrength = this.targets()[0].value;
      },
      onComplete: function() {
        gsap.to({ value: rippleStrength }, {
          value: 0,
          duration: 1.2,
          ease: 'power2.in',
          onUpdate: function() {
            rippleStrength = this.targets()[0].value;
          }
        });
      }
    });
  };
  
  // Handle window resize
  const onWindowResize = () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  
  // Animate camera with GSAP
  const animateCamera = () => {
    // Initial camera position far away
    camera.position.z = 120;
    camera.position.y = 30;
    camera.position.x = -20;
    
    // Create a timeline for sequential animations
    const tl = gsap.timeline();
    
    // First zoom in dramatically
    tl.to(camera.position, {
      duration: 3,
      z: 40,
      y: 0,
      x: 0,
      ease: 'power3.inOut'
    });
    
    // Then add a slight rotation
    tl.to(camera.rotation, {
      duration: 2,
      x: 0.1,
      y: 0.1,
      ease: 'power2.inOut'
    }, '-=1'); // Overlap with previous animation
  };
  
  // Animation loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Update controls
    controls.update();
    
    // 更新线条和灯光轨道
    if (neonLines) {
      neonLines.rotation.y = elapsedTime * 0.05;
      
      // 更新灯光轨道上的光点
      if (neonLines.userData.lightTracks) {
        neonLines.userData.lightTracks.forEach(track => {
          const { lightPoint } = track;
          
          // 更新光点在轨道上的位置
          lightPoint.userData.trackTime += lightPoint.userData.speed * 0.005;
          if (lightPoint.userData.trackTime > 1) {
            lightPoint.userData.trackTime = 0;
          }
          
          // 获取轨道上的位置
          const position = lightPoint.userData.trackCurve.getPointAt(lightPoint.userData.trackTime);
          lightPoint.position.copy(position);
          
          // 获取下一个点，用于确定朝向
          const lookAtPosition = lightPoint.userData.trackCurve.getPointAt(
            (lightPoint.userData.trackTime + 0.01) % 1
          );
          
          // 让光点朝向轨道前方
          lightPoint.lookAt(lookAtPosition);
          
          // 让聚光灯始终指向场景中心
          if (lightPoint.children.length >= 2) {
            const spotLight = lightPoint.children[1];
            if (spotLight.isSpotLight) {
              spotLight.target.position.set(0, 0, 0);
              spotLight.target.updateMatrixWorld();
            }
          }
          
          // 添加脉冲效果
          const pulseScale = 1 + Math.sin(elapsedTime * 3) * 0.2;
          lightPoint.scale.set(pulseScale, pulseScale, pulseScale);
        });
      }
      
      neonLines.children.forEach((line, i) => {
        const lineGeometry = line.geometry;
        const positions = lineGeometry.attributes.position.array;
        const originalPoints = line.userData.originalPoints;
        const speed = line.userData.speed;
        
        for (let j = 0; j < originalPoints.length; j++) {
          const idx = j * 3;
          const originalPoint = originalPoints[j];
          
          // 应用更复杂的波浪效果
          const waveX = Math.sin(elapsedTime * speed + j * 0.1) * 4; // 增加波动幅度
          const waveY = Math.cos(elapsedTime * speed + j * 0.1) * 4;
          const waveZ = Math.sin(elapsedTime * speed * 0.5 + j * 0.1) * 4;
          
          // 添加波纹效果
          const dist = Math.sqrt(
            originalPoint.x * originalPoint.x + 
            originalPoint.y * originalPoint.y + 
            originalPoint.z * originalPoint.z
          );
          
          const rippleWave = Math.sin(dist * 0.5 - elapsedTime * 3) * rippleStrength * 5;
          
          positions[idx] = originalPoint.x + waveX + (originalPoint.x / dist) * rippleWave;
          positions[idx + 1] = originalPoint.y + waveY + (originalPoint.y / dist) * rippleWave;
          positions[idx + 2] = originalPoint.z + waveZ + (originalPoint.z / dist) * rippleWave;
        }
        
        lineGeometry.attributes.position.needsUpdate = true;
      });
    }
    
    // Influence camera based on mouse position
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    // 直接渲染场景
    renderer.render(scene, camera);
  };
  
  // Clean up resources
  const cleanup = () => {
    // Clean up event listeners
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('scroll', onScroll);
    if (sceneContainer && sceneContainer.removeEventListener) {
      sceneContainer.removeEventListener('click', onSceneClick);
    }
    
    // Stop animation loop
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Dispose of Three.js resources
    if (neonLines) {
      neonLines.children.forEach(line => {
        line.geometry.dispose();
        line.material.dispose();
      });
      scene.remove(neonLines);
    }
    
    if (controls) {
      controls.dispose();
    }
    
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer.dispose();
    }
  };
  
  return {
    init,
    cleanup
  };
}