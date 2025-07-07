<template>
  <div class="loading-screen" :class="{ 'loading-complete': loadingComplete }">
    <!-- 中间的网站名称加载 -->
    <div class="site-name-container">
      <div 
        v-for="(letter, index) in siteName" 
        :key="index"
        class="letter"
        :class="{ 
          'active': loadingProgress >= (index + 1) * letterLoadThreshold,
          'transition-letter': transitionLetterIndex === index && loadingComplete 
        }"
      >
        {{ letter }}
      </div>
    </div>
    
    <!-- 左下角百分比进度展示 -->
    <div class="loading-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
      </div>
      <div class="progress-text">{{ Math.floor(loadingProgress) }}%</div>
    </div>
    
    <!-- 扫描线已移除 -->
    
    <!-- 科技感元素：网格背景 -->
    <div class="grid-background"></div>
    
    <!-- 科技感元素：粒子效果 -->
    <div ref="particlesContainer" class="particles-container"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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

// Three.js 变量
let scene, camera, renderer, particles;

// 监听进度变化
watch(() => props.progress, (newProgress) => {
  // 使用GSAP平滑过渡进度值
  gsap.to(loadingProgress, {
    value: newProgress,
    duration: 0.5,
    ease: "power2.out"
  });
  
  // 当加载完成时，确保进度真正达到100%
  if (newProgress === 100 && !loadingComplete.value) {
    // 添加小延迟，确保所有资源都已加载完成
    setTimeout(() => {
      completeLoading();
    }, 300);
  }
});

// 完成加载的处理函数
const completeLoading = () => {
  // 标记加载完成
  loadingComplete.value = true;
  
  // 执行字母放大过渡动画
  setTimeout(() => {
    // 通知父组件加载已完成
    emit('complete');
    props.onComplete();
  }, 1500); // 给过渡动画留出时间
};

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
  const particleCount = 100;
  
  // 创建粒子位置数组
  const positions = new Float32Array(particleCount * 3);
  
  // 设置粒子位置
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
  }
  
  // 设置几何体属性
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // 创建粒子材质
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.5,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  // 创建粒子系统
  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);
  
  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate);
    
    // 旋转粒子系统
    particles.rotation.x += 0.001;
    particles.rotation.y += 0.002;
    
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
  
  // 模拟加载进度（实际应用中应该使用props.progress）
  if (props.progress === 0) {
    const interval = setInterval(() => {
      if (loadingProgress.value < 100) {
        loadingProgress.value += 1;
      } else {
        clearInterval(interval);
        completeLoading();
      }
    }, 50);
  }
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
}

.letter {
  font-size: 3rem;
  font-weight: 700;
  color: #333;
  margin: 0 0.2rem;
  opacity: 0.3;
  transform: translateY(20px);
  transition: color 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

.letter.active {
  color: #00ffff;
  opacity: 1;
  transform: translateY(0);
}

.transition-letter {
  animation: letterExpand 1.5s forwards;
  z-index: 1001;
}

@keyframes letterExpand {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(20) translateY(0);
    opacity: 0.8;
  }
  100% {
    transform: scale(50) translateY(0);
    opacity: 0;
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
  width: 200px;
}

.progress-bar {
  width: 100%;
  height: 2px;
  background-color: #333;
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #00ffff;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #00ffff;
  font-family: monospace;
}

/* 扫描线已移除 */

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
  background-size: 20px 20px;
  opacity: 0.3;
  z-index: -1;
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
</style>