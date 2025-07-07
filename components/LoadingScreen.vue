<template>
  <div class="loading-screen" :class="{ 'loading-complete': loadingComplete }">
    <!-- 数字雨效果 -->
    <div class="digital-rain">
      <div v-for="(column, colIndex) in digitalRainColumns" :key="'col-'+colIndex" class="rain-column" :style="{ left: column.position + '%', animationDuration: column.speed + 's' }">
        <span v-for="(char, charIndex) in column.chars" :key="'char-'+charIndex" class="rain-char" :style="{ opacity: char.opacity, animationDelay: charIndex * 0.1 + 's' }">
          {{ char.value }}
        </span>
      </div>
    </div>
    
    <!-- 中间的网站名称加载 -->
    <div class="site-name-container">
      <div 
        v-for="(letter, index) in siteName" 
        :key="index"
        class="letter"
        :class="{ 
          'active': loadingProgress >= (index + 1) * letterLoadThreshold,
          'transition-letter': transitionLetterIndex === index && loadingComplete,
          'glitch': loadingProgress > 50 && Math.random() < 0.3
        }"
        :data-text="letter"
      >
        {{ letter }}
      </div>
    </div>
    
    <!-- 左下角百分比进度展示 -->
    <div class="loading-progress">
      <div class="progress-text">SYSTEM LOADING: {{ Math.floor(loadingProgress) }}%</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
      </div>
      <div class="loading-status">{{ loadingStatusText }}</div>
    </div>
    
    <!-- 右上角系统信息 -->
    <div class="system-info">
      <div class="info-line">SYSTEM: <span class="info-value">LIAM.DEV</span></div>
      <div class="info-line">STATUS: <span class="info-value">INITIALIZING</span></div>
      <div class="info-line">MEMORY: <span class="info-value">{{ Math.floor(loadingProgress * 10.24) }} MB / 1024 MB</span></div>
      <div class="info-line">TIME: <span class="info-value">{{ currentTime }}</span></div>
    </div>
    
    <!-- 科技感元素：网格背景 -->
    <div class="grid-background">
      <div class="grid-overlay"></div>
    </div>
    
    <!-- 科技感元素：粒子效果 -->
    <div ref="particlesContainer" class="particles-container"></div>
    
    <!-- 科技感元素：十字准星 -->
    <div class="crosshair">
      <div class="crosshair-h"></div>
      <div class="crosshair-v"></div>
      <div class="crosshair-circle"></div>
    </div>
    
    <!-- 科技感元素：角落装饰 -->
    <div class="corner top-left"></div>
    <div class="corner top-right"></div>
    <div class="corner bottom-left"></div>
    <div class="corner bottom-right"></div>
    
    <!-- 科技感元素：圆形加载指示器 -->
    <div class="circular-loader">
      <svg viewBox="0 0 100 100">
        <circle class="loader-track" cx="50" cy="50" r="45"></circle>
        <circle class="loader-fill" cx="50" cy="50" r="45" :style="{ 'stroke-dashoffset': 283 - (283 * loadingProgress / 100) }"></circle>
      </svg>
      <div class="loader-center"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { gsap } from 'gsap';

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  onComplete: {
    type: Function,
    default: () => {}
  }
});

const emit = defineEmits(['complete']);

// 状态变量
const loadingProgress = ref(0);
const loadingComplete = ref(false);
const siteName = "LIAM.DEV".split('');
const letterLoadThreshold = 100 / siteName.length;
const transitionLetterIndex = ref(3); // 'M' 字母的索引
const particlesContainer = ref(null);

// 加载状态文本
const loadingStatusMessages = [
  "INITIALIZING SYSTEM...",
  "LOADING CORE MODULES...",
  "ESTABLISHING CONNECTION...",
  "PROCESSING DATA...",
  "RENDERING INTERFACE...",
  "OPTIMIZING PERFORMANCE...",
  "FINALIZING SETUP..."
];
const loadingStatusText = ref(loadingStatusMessages[0]);

// 当前时间
const currentTime = ref('');
let timeInterval;

// 更新时间
const updateTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

// 数字雨效果
const digitalRainColumns = ref([]);
const possibleChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

// 初始化数字雨
const initDigitalRain = () => {
  const columns = [];
  const columnCount = 15; // 列数
  
  for (let i = 0; i < columnCount; i++) {
    const charCount = 5 + Math.floor(Math.random() * 10); // 每列5-15个字符
    const chars = [];
    
    for (let j = 0; j < charCount; j++) {
      chars.push({
        value: possibleChars[Math.floor(Math.random() * possibleChars.length)],
        opacity: Math.random() * 0.5 + 0.1
      });
    }
    
    columns.push({
      position: (100 / columnCount) * i,
      speed: 3 + Math.random() * 7, // 3-10秒的动画时间
      chars
    });
  }
  
  digitalRainColumns.value = columns;
};

// 更新数字雨
const updateDigitalRain = () => {
  digitalRainColumns.value.forEach(column => {
    column.chars.forEach(char => {
      // 随机更新字符
      if (Math.random() < 0.1) {
        char.value = possibleChars[Math.floor(Math.random() * possibleChars.length)];
      }
    });
  });
};

// 更新加载状态文本
const updateLoadingStatus = () => {
  const progressIndex = Math.floor(loadingProgress.value / (100 / loadingStatusMessages.length));
  const safeIndex = Math.min(progressIndex, loadingStatusMessages.length - 1);
  loadingStatusText.value = loadingStatusMessages[safeIndex];
};

// Three.js 变量
let scene, camera, renderer, particles;

// 监听进度变化
watch(() => props.progress, (newProgress) => {
  console.log('进度更新:', newProgress);
  
  // 使用GSAP平滑过渡进度值
  gsap.to(loadingProgress, {
    value: newProgress,
    duration: 0.5,
    ease: "power2.out",
    onUpdate: () => {
      // 更新加载状态文本
      updateLoadingStatus();
    }
  });
  
  // 当加载完成时，确保进度真正达到100%
  if (newProgress >= 100 && !loadingComplete.value) {
    console.log('加载完成，触发完成回调');
    // 添加小延迟，确保所有资源都已加载完成
    setTimeout(() => {
      completeLoading();
    }, 300);
  }
}, { immediate: true }); // 立即执行一次，确保初始值被正确处理

// 完成加载的处理函数
const completeLoading = () => {
  // 防止重复触发
  if (loadingComplete.value) return;
  
  console.log('执行完成加载函数');
  
  // 标记加载完成
  loadingComplete.value = true;
  loadingStatusText.value = "SYSTEM READY";
  
  // 执行字母放大过渡动画
  setTimeout(() => {
    console.log('通知父组件加载完成');
    // 通知父组件加载已完成
    emit('complete');
    props.onComplete();
  }, 1500); // 给过渡动画留出时间
};

// 数字雨更新间隔
let digitalRainInterval;

// 初始化粒子系统
const initParticles = () => {
  if (!particlesContainer.value) return;
  
  const container = particlesContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // 创建场景
  scene = new THREE.Scene();
  
  // 创建相机
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 50;
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // 创建粒子几何体
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 300; // 增加粒子数量
  
  // 创建粒子位置数组
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  
  // 设置粒子位置、大小、颜色和速度
  for (let i = 0; i < particleCount; i++) {
    // 创建更广泛的分布
    const radius = 150 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2; // 水平角度
    const phi = Math.random() * Math.PI; // 垂直角度
    
    // 使用球坐标系创建更自然的分布
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius; // x
    positions[i * 3 + 1] = Math.cos(phi) * radius * 0.6; // y (稍微压缩垂直方向)
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius; // z
    
    // 随机大小
    sizes[i] = Math.random() * 2.5 + 0.5;
    
    // 随机颜色 - 从青色到蓝紫色的渐变
    const colorChoice = Math.random();
    if (colorChoice < 0.6) {
      // 青色
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    } else if (colorChoice < 0.9) {
      // 蓝色
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    } else {
      // 紫色
      colors[i * 3] = 0.5 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    }
    
    // 随机速度
    speeds[i] = Math.random() * 0.02 + 0.01;
  }
  
  // 设置几何体属性
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // 创建粒子材质 - 使用更高级的自定义着色器材质
  const particlesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(width, height) },
      mousePosition: { value: new THREE.Vector2(0.5, 0.5) }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vDistance;
      uniform float time;
      
      float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vColor = color;
        
        // 添加基于时间的波动效果
        vec3 pos = position;
        float noise = rand(vec2(position.x, position.y)) * 2.0 - 1.0;
        float timeFactor = sin(time * 0.5 + noise * 5.0) * 0.5 + 0.5;
        
        // 添加呼吸效果
        pos *= 1.0 + sin(time * 0.2) * 0.05;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = length(mvPosition.xyz);
        
        // 动态大小变化
        float sizeFactor = size * (1.0 + sin(time + noise * 10.0) * 0.3);
        gl_PointSize = sizeFactor * (300.0 / -mvPosition.z);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vDistance;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 mousePosition;
      
      void main() {
        // 创建圆形粒子
        vec2 center = vec2(0.5, 0.5);
        float distance = length(gl_PointCoord - center);
        if (distance > 0.5) discard;
        
        // 添加发光效果
        float glow = 1.0 - smoothstep(0.2, 0.5, distance);
        glow = pow(glow, 1.5);
        
        // 添加时间变化的颜色调整
        vec3 finalColor = vColor;
        finalColor.r += sin(time * 0.5) * 0.1;
        finalColor.b += cos(time * 0.3) * 0.1;
        
        // 限制颜色范围
        finalColor = clamp(finalColor, 0.0, 1.0);
        
        // 最终颜色
        float alpha = glow * (1.0 - vDistance / 1000.0);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  // 创建粒子系统
  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);
  
  // 存储原始位置
  const originalPositions = positions.slice();
  
  // 鼠标位置跟踪
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  
  // 添加鼠标移动事件监听
  container.addEventListener('mousemove', (event) => {
    // 计算鼠标在容器内的相对位置（0-1范围）
    targetMouseX = event.clientX / window.innerWidth;
    targetMouseY = 1.0 - (event.clientY / window.innerHeight); // 反转Y轴使其与WebGL坐标系一致
  });
  
  // 添加触摸事件支持
  container.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
      targetMouseX = event.touches[0].clientX / window.innerWidth;
      targetMouseY = 1.0 - (event.touches[0].clientY / window.innerHeight);
      event.preventDefault();
    }
  }, { passive: false });
  
  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate);
    
    // 平滑过渡鼠标位置
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    
    // 更新着色器中的鼠标位置
    particlesMaterial.uniforms.mousePosition.value.set(mouseX, mouseY);
    
    // 更新时间
    particlesMaterial.uniforms.time.value += 0.01;
    
    // 更新粒子位置
    const positions = particlesGeometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      // 创建波浪效果
      const i3 = i * 3;
      const x = originalPositions[i3];
      const y = originalPositions[i3 + 1];
      const z = originalPositions[i3 + 2];
      
      // 计算到原点的距离
      const distance = Math.sqrt(x*x + y*y + z*z);
      
      // 创建波浪效果
      const time = Date.now() * 0.0005;
      const offset = Math.sin(distance * 0.02 + time) * 5;
      
      // 基本波浪效果
      let newX = originalPositions[i3] + offset * (x / distance) * 0.3;
      let newY = originalPositions[i3 + 1] + offset * (y / distance) * 0.3;
      let newZ = originalPositions[i3 + 2] + offset * (z / distance) * 0.3;
      
      // 添加鼠标交互效果 - 粒子会被鼠标位置轻微吸引
      const mouseInfluence = 0.1;
      const mouseDistanceX = (mouseX - 0.5) * width * 0.5;
      const mouseDistanceY = (mouseY - 0.5) * height * 0.5;
      
      // 计算粒子到鼠标的距离
      const dx = newX - mouseDistanceX;
      const dy = newY - mouseDistanceY;
      const dz = newZ;
      const mouseDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // 根据距离计算影响力
      const influence = Math.max(0, 1 - mouseDistance / 100) * mouseInfluence;
      
      // 应用鼠标影响
      newX += (mouseDistanceX - newX) * influence;
      newY += (mouseDistanceY - newY) * influence;
      
      // 更新位置
      positions[i3] = newX;
      positions[i3 + 1] = newY;
      positions[i3 + 2] = newZ;
    }
    
    particlesGeometry.attributes.position.needsUpdate = true;
    
    // 旋转粒子系统 - 根据鼠标位置调整旋转速度
    particles.rotation.y += 0.001 + (mouseX - 0.5) * 0.001;
    particles.rotation.x += (mouseY - 0.5) * 0.0005;
    
    // 渲染场景
    renderer.render(scene, camera);
  };
  
  animate();
  
  // 窗口大小调整处理
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
  });
};

// 组件挂载时初始化
onMounted(() => {
  // 初始化粒子系统
  initParticles();
  
  // 初始化数字雨效果
  initDigitalRain();
  
  // 设置数字雨更新间隔
  digitalRainInterval = setInterval(updateDigitalRain, 500);
  
  // 初始化时间更新
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  
  // 初始化加载状态文本
  updateLoadingStatus();
  
  // 只在没有外部进度时模拟加载进度
  // 注意：我们不再在这里模拟加载进度，而是完全依赖props.progress
  // 这样可以避免重复加载的问题
});

// 组件卸载前清理
onBeforeUnmount(() => {
  // 清理定时器
  if (timeInterval) clearInterval(timeInterval);
  if (digitalRainInterval) clearInterval(digitalRainInterval);
  
  // 清理事件监听器
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #050505;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
  transition: opacity 0.5s ease;
  color: #00ffff;
  font-family: 'Courier New', monospace;
}

.loading-complete {
  opacity: 0;
  pointer-events: none;
}

/* 网站名称样式 */
.site-name-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  perspective: 1000px;
  transform-style: preserve-3d;
}

.letter {
  font-size: 3.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0.2rem;
  opacity: 0.3;
  transform: translateY(20px) rotateX(45deg);
  transition: color 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0);
}

.letter.active {
  color: #00ffff;
  opacity: 1;
  transform: translateY(0) rotateX(0);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3);
}

.letter.glitch {
  animation: glitch 0.3s ease-in-out;
  position: relative;
}

.letter.glitch::before,
.letter.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

.letter.glitch::before {
  color: #0ff;
  z-index: -1;
  transform: translateX(-2px);
  animation: glitch-anim-1 0.2s infinite linear alternate-reverse;
}

.letter.glitch::after {
  color: #f0f;
  z-index: -2;
  transform: translateX(2px);
  animation: glitch-anim-2 0.3s infinite linear alternate-reverse;
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

@keyframes glitch-anim-1 {
  0% { clip-path: inset(20% 0 80% 0); }
  20% { clip-path: inset(60% 0 40% 0); }
  40% { clip-path: inset(40% 0 60% 0); }
  60% { clip-path: inset(80% 0 20% 0); }
  80% { clip-path: inset(10% 0 90% 0); }
  100% { clip-path: inset(30% 0 70% 0); }
}

@keyframes glitch-anim-2 {
  0% { clip-path: inset(10% 0 90% 0); }
  20% { clip-path: inset(30% 0 70% 0); }
  40% { clip-path: inset(50% 0 50% 0); }
  60% { clip-path: inset(70% 0 30% 0); }
  80% { clip-path: inset(90% 0 10% 0); }
  100% { clip-path: inset(20% 0 80% 0); }
}

.transition-letter {
  animation: letterExpand 1.5s forwards;
  z-index: 1001;
}

@keyframes letterExpand {
  0% {
    transform: scale(1) translateY(0) rotateX(0);
    opacity: 1;
    filter: blur(0);
  }
  50% {
    transform: scale(20) translateY(0) rotateX(10deg);
    opacity: 0.8;
    filter: blur(1px);
  }
  100% {
    transform: scale(50) translateY(0) rotateX(20deg);
    opacity: 0;
    filter: blur(5px);
  }
}

/* 进度条样式 */
.loading-progress {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 250px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(0, 255, 255, 0.1);
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #0088ff);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 1rem;
  color: #00ffff;
  font-family: monospace;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
}

.loading-status {
  font-size: 0.7rem;
  color: rgba(0, 255, 255, 0.7);
  font-family: monospace;
  letter-spacing: 1px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}



/* 科技感元素：网格背景 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
  z-index: -1;
  animation: grid-pulse 4s infinite;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 0%, rgba(5, 5, 5, 0.8) 80%);
}

@keyframes grid-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.4; }
}

/* 科技感元素：粒子容器 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

/* 科技感元素：十字准星 */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  opacity: 0.3;
  pointer-events: none;
}

.crosshair-h, .crosshair-v {
  position: absolute;
  background-color: rgba(0, 255, 255, 0.5);
}

.crosshair-h {
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}

.crosshair-v {
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

.crosshair-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(0, 255, 255, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
}

/* 科技感元素：角落装饰 */
.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: rgba(0, 255, 255, 0.5);
  opacity: 0.8;
}

.top-left {
  top: 20px;
  left: 20px;
  border-top: 2px solid;
  border-left: 2px solid;
}

.top-right {
  top: 20px;
  right: 20px;
  border-top: 2px solid;
  border-right: 2px solid;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
  border-bottom: 2px solid;
  border-left: 2px solid;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
  border-bottom: 2px solid;
  border-right: 2px solid;
}

/* 数字雨效果 */
.digital-rain {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  opacity: 0.15;
  pointer-events: none;
}

.rain-column {
  position: absolute;
  top: -100px;
  font-family: monospace;
  font-size: 14px;
  color: #00ffff;
  animation: rain-fall linear infinite;
  text-align: center;
}

.rain-char {
  display: block;
  margin-bottom: 5px;
  text-shadow: 0 0 5px #00ffff;
  animation: rain-glow 2s ease-in-out infinite alternate;
}

@keyframes rain-fall {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes rain-glow {
  0%, 100% { text-shadow: 0 0 5px #00ffff; }
  50% { text-shadow: 0 0 15px #00ffff, 0 0 20px #00ffff; }
}

/* 系统信息面板 */
.system-info {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 280px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: rgba(0, 255, 255, 0.7);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
}

.info-line {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
}

.info-value {
  color: #00ffff;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
}

/* 圆形加载指示器 */
.circular-loader {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  width: 80px;
  height: 80px;
}

.circular-loader svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.loader-track {
  fill: none;
  stroke: rgba(0, 255, 255, 0.1);
  stroke-width: 3;
}

.loader-fill {
  fill: none;
  stroke: #00ffff;
  stroke-width: 3;
  stroke-dasharray: 283; /* 2 * PI * 45 */
  stroke-linecap: round;
  filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.7));
  transition: stroke-dashoffset 0.5s ease;
}

.loader-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.2);
}
</style>