import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { gsap } from 'gsap';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass.js';

export default function useGeometryScene() {
  // Three.js variables
  let scene, camera, renderer, clock, controls, dragControls;
  let composer, renderPass, bloomPass, fxaaPass, filmPass, glitchPass, halftonePass; // 后处理变量
  let plane, geometries = [];
  let mouseX = 0, mouseY = 0;
  let windowHalfX, windowHalfY;
  let animationFrameId = null;
  
  // 科技感元素
  let particleSystem, gridHelper, hologramGroup;
  let scanLine, scanLinePosition = 0;
  let techEffectsTime = 0;
  let techMaterials = [];
  let glowingEdges = [];
  let dataTexts = [];
  
  // Mouse interaction variables
  let mouseIndicator;
  let raycaster;
  let mouse;
  let selectedObject = null;
  let isDragging = false;
  let intersectedObject = null;
  let mouseScreenPosition = new THREE.Vector2();
  let dragStartPosition = new THREE.Vector3();
  let dragPlane = new THREE.Plane();
  let dragOffset = new THREE.Vector3();
  
  // 加载管理器和加载进度
  let loadingManager;
  let loadingProgress = 0;
  let totalResources = 0;
  let loadedResources = 0;
  
  // 获取加载进度
  const getLoadingProgress = () => {
    // 确保只有在所有资源都加载完成时才返回100%
    if (loadingProgress >= 99.5 && loadingProgress < 100) {
      // 检查是否所有资源都已加载
      if (loadedResources < totalResources) {
        return 99;
      }
    }
    return loadingProgress;
  };
  
  // Initialize Three.js scene
  const init = (container) => {
    if (!container) {
      console.error('Container is null or undefined');
      return;
    }
    
    try {
      // 初始化加载管理器
      loadingManager = new THREE.LoadingManager();
      
      // 加载开始回调
      loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
        console.log('Started loading: ' + url);
        totalResources = itemsTotal;
      };
      
      // 加载进度回调
      loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        console.log(`Loading file: ${url} (${itemsLoaded}/${itemsTotal})`);
        loadedResources = itemsLoaded;
        totalResources = itemsTotal;
        loadingProgress = Math.floor((itemsLoaded / itemsTotal) * 100);
      };
      
      // 加载完成回调
      loadingManager.onLoad = () => {
        console.log('Loading complete!');
        loadedResources = totalResources;
        loadingProgress = 100;
        console.log(`所有资源加载完成: ${loadedResources}/${totalResources}`);
      };
      
      // 加载错误回调
      loadingManager.onError = (url) => {
        console.error('Error loading: ' + url);
      };
      
      // Set up scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      
      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Set up camera
      const fov = 60;
      const aspect = containerWidth / containerHeight;
      const near = 0.1;
      const far = 1000;
      camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      // Set initial camera position further away for the intro animation
      camera.position.set(120, 80, 150);
      camera.lookAt(0, 0, 0);
      
      // 设置极度优化的渲染器
      renderer = new THREE.WebGLRenderer({ 
        antialias: false,    // 禁用抗锯齿以提高性能
        powerPreference: 'high-performance',
        alpha: false,        // 禁用透明度以提高性能
        stencil: false,      // 禁用模板缓冲区以提高性能
        depth: true,         // 保留深度缓冲区
        precision: 'lowp',   // 使用低精度以提高性能
        logarithmicDepthBuffer: false // 禁用对数深度缓冲区以提高性能
      });
      renderer.setSize(containerWidth, containerHeight);
      renderer.setPixelRatio(0.75); // 使用更低的像素比以提高性能
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap; // 使用基础阴影映射以提高性能
      renderer.shadowMap.autoUpdate = false; // 禁用阴影自动更新
      renderer.physicallyCorrectLights = false; // 禁用物理正确的光照以提高性能
      renderer.outputEncoding = THREE.LinearEncoding; // 使用线性编码以提高性能
      renderer.toneMapping = THREE.NoToneMapping; // 禁用色调映射以提高性能
      renderer.toneMappingExposure = 1.0; // 使用默认曝光值
      container.appendChild(renderer.domElement);
      
      // 极简后处理效果，只保留必要的通道
      composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(containerWidth * 0.5, containerHeight * 0.5)); // 降低渲染目标分辨率
      
      // 添加基本渲染通道 - 必须保留
      renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      // 极简辉光效果 - 只在特殊情况下启用
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(containerWidth / 8, containerHeight / 8), // 极低分辨率
        0.05,   // 极低强度
        0.05,   // 极低半径
        0.95    // 极高阈值
      );
      composer.addPass(bloomPass);
      
      // 完全移除其他后处理效果
      fxaaPass = null;
      filmPass = null;
      glitchPass = null;
      halftonePass = null;
      
      // 设置简化的轨道控制器
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1; // 增加阻尼以减少更新频率
      controls.enableZoom = true;
      controls.autoRotate = false;
      controls.rotateSpeed = 0.5; // 降低旋转速度
      controls.zoomSpeed = 0.5; // 降低缩放速度
      controls.enablePan = false; // 禁用平移以减少计算
      
      // Set up raycaster for object selection
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Create mouse indicator (circular cursor)
      createMouseIndicator();
      
      // Set up drag controls
      dragControls = new DragControls(geometries, camera, renderer.domElement);
      dragControls.addEventListener('dragstart', onDragStart);
      dragControls.addEventListener('dragend', onDragEnd);
      dragControls.addEventListener('drag', onDrag);
      
      // Disable drag controls initially (we'll handle dragging manually)
      dragControls.enabled = false;
      
      // Set up clock for animations
      clock = new THREE.Clock();
      
      // 添加科技感元素
      createGeometryTechEnvironment();
      
      // Add lights
      addLights();
      
      // Create plane
      createPlane();
      
      // Create various geometries
      createGeometries();
      
      // 创建粒子系统
      createParticleSystem();
      
      // 创建全息投影效果
      createHologramEffect();
      
      // 创建扫描线效果
      createScanLine();
      
      // Set container dimensions for mouse tracking
      windowHalfX = containerWidth / 2;
      windowHalfY = containerHeight / 2;
      
      // Add event listeners
      document.addEventListener('mousemove', onMouseMove);
      window.addEventListener('resize', onWindowResize);
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('click', onClick);
      
      // Make canvas interactive
      renderer.domElement.style.pointerEvents = 'auto';
      
      // Start animation loop
      animate();
      
      // Start camera intro animation
      startCameraIntroAnimation();
      
      return { scene, camera, renderer };
    } catch (error) {
      console.error('Error initializing Three.js scene:', error);
      cleanup(); // Clean up any resources that might have been created
      return null;
    }
  };
  
  // 极简光照设置 - 优化性能
  const addLights = () => {
    if (!scene) return;
    
    try {
      // 创建灯光组，便于管理
      const lightGroup = new THREE.Group();
      scene.add(lightGroup);
      
      // 增强环境光 - 提供足够的基础亮度，减少其他光源需求
      const ambientLight = new THREE.AmbientLight(0x808080, 3.5);
      scene.add(ambientLight);
      
      // 主平行光 - 简化阴影设置
      const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
      directionalLight.position.set(50, 100, 50);
      directionalLight.castShadow = true;
      // 降低阴影贴图分辨率以提高性能
      directionalLight.shadow.mapSize.width = 512; 
      directionalLight.shadow.mapSize.height = 512;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 500;
      directionalLight.shadow.camera.left = -100;
      directionalLight.shadow.camera.right = 100;
      directionalLight.shadow.camera.top = 100;
      directionalLight.shadow.camera.bottom = -100;
      directionalLight.shadow.bias = -0.0001;
      directionalLight.shadow.radius = 4; // 增加阴影模糊以掩盖低分辨率
      lightGroup.add(directionalLight);
      
      // 只保留两个关键点光源，移除阴影投射
      // 点光源1 - 青色
      const pointLight1 = new THREE.PointLight(0x00ffff, 8, 150);
      pointLight1.position.set(30, 40, 30);
      pointLight1.castShadow = false; // 关闭阴影以提高性能
      lightGroup.add(pointLight1);
      
      // 点光源2 - 紫色
      const pointLight2 = new THREE.PointLight(0xff00ff, 8, 150);
      pointLight2.position.set(-30, 40, -30);
      pointLight2.castShadow = false;
      lightGroup.add(pointLight2);
      
      // 移除其他点光源和聚光灯
      
      // 保留半球光以提供基础照明
      const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 2.0);
      scene.add(hemisphereLight);
      
      // 简化雾效
      scene.fog = new THREE.FogExp2(0x000814, 0.001);
      
      // 存储灯光组以便在动画中使用
      scene.userData.lightGroup = lightGroup;
      
      // 简化灯光动画，降低更新频率
      scene.userData.animateLights = (delta) => {
        // 只在需要时更新灯光位置
        const time = Date.now() * 0.0005; // 降低动画速度
        
        if (pointLight1 && pointLight2) {
          // 简化点光源1动画
          pointLight1.position.x = Math.sin(time * 0.3) * 40;
          pointLight1.position.z = Math.cos(time * 0.3) * 40;
          
          // 简化点光源2动画
          pointLight2.position.x = Math.sin(time * 0.4 + 2) * 40;
          pointLight2.position.z = Math.cos(time * 0.4 + 2) * 40;
        }
      };
    } catch (error) {
      console.error('Error adding lights:', error);
    }
  };
  
  // 创建简化科技感环境
  const createGeometryTechEnvironment = () => {
    if (!scene) return;
    
    try {
      // 创建网格地面 - 减少网格密度
      const gridSize = 1000;
      const gridDivisions = 50; // 大幅减少网格线数量
      gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0x004444);
      gridHelper.position.y = 0.1; // 稍微抬高，避免与反射地面冲突
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.3;
      scene.add(gridHelper);
      
      // 创建坐标轴辅助（科技感元素）
      const axesHelper = new THREE.AxesHelper(20);
      axesHelper.position.set(-700, 0.2, -700); // 放在场景边缘
      scene.add(axesHelper);
      
      // 使用简单的立方体贴图代替HDR环境贴图，提高性能
      // 创建一个简单的渐变背景，减少加载时间和内存占用
      const bgColor1 = new THREE.Color(0x000814); // 深蓝色
      const bgColor2 = new THREE.Color(0x001428); // 稍亮的蓝色
      
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, '#' + bgColor1.getHexString());
      gradient.addColorStop(1, '#' + bgColor2.getHexString());
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 2);
      
      const bgTexture = new THREE.CanvasTexture(canvas);
      bgTexture.wrapS = THREE.RepeatWrapping;
      bgTexture.wrapT = THREE.RepeatWrapping;
      
      scene.background = bgTexture;
      
      // 创建一个简单的环境贴图，用于基本反射
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128); // 非常低的分辨率
      const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
      cubeCamera.position.set(0, 30, 0);
      scene.add(cubeCamera);
      
      // 设置场景的环境贴图
      scene.environment = cubeRenderTarget.texture;
      
      // 只更新一次立方体相机，而不是每帧更新
      cubeCamera.update(renderer, scene);
    } catch (error) {
      console.error('Error creating tech environment:', error);
    }
  };
  
  // 创建极简粒子系统
  const createParticleSystem = () => {
    if (!scene) return;
    
    try {
      // 创建粒子几何体 - 大幅减少粒子数量
      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 500; // 从2000减少到500
      
      // 创建粒子位置数组
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      // 设置粒子位置、颜色和大小
      for (let i = 0; i < particleCount; i++) {
        // 位置 - 在较小范围内随机分布，减少视觉复杂度
        positions[i * 3] = (Math.random() - 0.5) * 600; // x
        positions[i * 3 + 1] = Math.random() * 300; // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 600; // z
        
        // 简化颜色 - 只使用一种颜色
        // 青色
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
        
        // 统一大小 - 减少计算
        sizes[i] = 1.5;
      }
      
      // 设置几何体属性
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      // 创建粒子材质 - 简化混合模式
      const particlesMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6, // 降低不透明度
        blending: THREE.NormalBlending, // 使用普通混合代替加法混合
        sizeAttenuation: true,
        depthWrite: false
      });
      
      // 创建粒子系统
      particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      particleSystem.name = 'techParticles';
      scene.add(particleSystem);
    } catch (error) {
      console.error('Error creating particle system:', error);
    }
  };
  
  // 创建简化全息投影效果
  const createHologramEffect = () => {
    if (!scene) return;
    
    try {
      // 创建全息投影组
      hologramGroup = new THREE.Group();
      hologramGroup.position.set(0, 30, 0);
      scene.add(hologramGroup);
      
      // 创建全息圆环 - 减少几何体复杂度
      const ringGeometry = new THREE.RingGeometry(10, 10.5, 32); // 从64段减少到32段
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.FrontSide, // 只渲染正面以提高性能
        transparent: true,
        opacity: 0.5 // 降低不透明度
      });
      
      // 减少环的数量，从5个减少到3个
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // 水平放置
        ring.position.y = i * 3 - 3; // 垂直分布
        ring.scale.set(1 - i * 0.2, 1 - i * 0.2, 1); // 逐渐缩小
        hologramGroup.add(ring);
      }
      
      // 简化垂直扫描线
      const scanGeometry = new THREE.PlaneGeometry(20, 40); // 减小尺寸
      const scanMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        side: THREE.FrontSide // 只渲染正面
      });
      
      const verticalScan = new THREE.Mesh(scanGeometry, scanMaterial);
      verticalScan.rotation.y = Math.PI / 2;
      hologramGroup.add(verticalScan);
      
      // 简化数据文本效果 - 直接在这里创建，不调用单独的函数
      // 创建虚拟数据显示 - 减少数量
      const dataGeometry = new THREE.PlaneGeometry(4, 0.5);
      const dataMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.FrontSide
      });
      
      // 只创建4行数据，而不是10行
      for (let i = 0; i < 4; i++) {
        const dataPlane = new THREE.Mesh(dataGeometry, dataMaterial);
        dataPlane.position.set(-5, i * 1.2 - 2, -5);
        hologramGroup.add(dataPlane);
        dataTexts.push(dataPlane);
      }
    } catch (error) {
      console.error('Error creating hologram effect:', error);
    }
  };
  
  // 移除单独的createHologramText函数，将其合并到createHologramEffect中
  
  // 创建简化扫描线效果
  const createScanLine = () => {
    if (!scene) return;
    
    try {
      // 创建扫描线平面 - 减小尺寸
      const scanLineGeometry = new THREE.PlaneGeometry(800, 1); // 减小尺寸和厚度
      const scanLineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2, // 降低不透明度
        side: THREE.FrontSide // 只渲染正面以提高性能
      });
      
      scanLine = new THREE.Mesh(scanLineGeometry, scanLineMaterial);
      scanLine.rotation.x = Math.PI / 2; // 水平放置
      scanLine.position.y = 0.5; // 稍微抬高，避免与地面冲突
      scene.add(scanLine);
    } catch (error) {
      console.error('Error creating scan line:', error);
    }
  };
  
  // 创建简化地面平面 - 大幅降低反射质量以提高性能
  const createPlane = () => {
    if (!scene) return;
    
    try {
      // 使用简单的平面几何体代替高质量反射
      const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1); // 极简几何体，无细分
      
      // 创建简单的材质，不使用复杂的反射
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.7,
        roughness: 0.3,
        envMapIntensity: 0.5
      });
      
      // 创建平面
      plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2; // 旋转为水平面
      plane.position.y = 0; // 地板位置
      plane.receiveShadow = true;
      plane.name = 'floor'; // 添加名称以便于识别
      scene.add(plane);
      
      // 添加兼容性方法
      plane.userData.isReflective = false; // 标记为非反射
      plane.userData.updateReflection = () => {
        // 空方法，保留兼容性
      };
      
      // 添加简化的地板网格线效果
      const gridSize = 1000;
      const gridDivisions = 50; // 大幅减少网格线数量
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0x004444);
      gridHelper.position.y = 0.01; // 稍微抬高，避免与地面冲突
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.15; // 降低不透明度，使其更微妙
      scene.add(gridHelper);
      
      scene.add(plane);
    } catch (error) {
      console.error('Error creating mirror plane:', error);
    }
  };
  
  // 生成噪声纹理数据 - 用于凹凸贴图
  const generateNoiseTexture = (width, height) => {
    const size = width * height * 4; // RGBA格式，每个像素4个值
    const data = new Float32Array(size);
    
    for (let i = 0; i < size; i += 4) {
      // 生成随机噪声值
      const noise = Math.random() * 0.5 + 0.5; // 0.5-1.0范围内的值，使纹理更加细腻
      
      // 设置RGBA值
      data[i] = noise;     // R
      data[i + 1] = noise; // G
      data[i + 2] = noise; // B
      data[i + 3] = 1.0;   // A (不透明)
    }
    
    // 创建纹理并使用加载管理器
    const texture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    
    // 手动触发加载管理器的进度更新
    if (loadingManager) {
      loadingManager.itemStart('noise-texture');
      setTimeout(() => {
        loadingManager.itemEnd('noise-texture');
      }, 100);
    }
    
    texture.needsUpdate = true;
    return texture;
  };
  
  // 生成法线贴图数据
  const generateNormalMap = (width, height, strength = 1.0) => {
    // 首先生成高度图
    const heightData = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      // 使用Perlin噪声或分形噪声会更好，但这里用简单随机作为示例
      heightData[i] = Math.random();
    }
    
    // 从高度图生成法线贴图
    const normalData = new Float32Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        
        // 计算相邻像素的高度差（使用环绕方式处理边界）
        const left = heightData[y * width + (x > 0 ? x - 1 : width - 1)];
        const right = heightData[y * width + (x < width - 1 ? x + 1 : 0)];
        const top = heightData[(y > 0 ? y - 1 : height - 1) * width + x];
        const bottom = heightData[(y < height - 1 ? y + 1 : 0) * width + x];
        
        // 计算法线向量 (使用Sobel算子)
        const dx = (right - left) * strength;
        const dy = (bottom - top) * strength;
        const dz = 1.0 / Math.sqrt(dx * dx + dy * dy + 1);
        
        // 将法线向量转换为RGB颜色 (范围从[-1,1]转换到[0,1])
        normalData[index] = (dx * dz * 0.5 + 0.5);
        normalData[index + 1] = (dy * dz * 0.5 + 0.5);
        normalData[index + 2] = dz * 0.5 + 0.5;
        normalData[index + 3] = 1.0;
      }
    }
    
    // 创建纹理并使用加载管理器
    const texture = new THREE.DataTexture(
      normalData,
      width,
      height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    
    // 手动触发加载管理器的进度更新
    if (loadingManager) {
      loadingManager.itemStart('normal-map');
      setTimeout(() => {
        loadingManager.itemEnd('normal-map');
      }, 150);
    }
    
    texture.needsUpdate = true;
    return texture;
  };
  
  // 生成金属纹理数据 - 用于金属度贴图
  const generateMetalnessTexture = (width, height) => {
    const size = width * height * 4;
    const data = new Float32Array(size);
    
    for (let i = 0; i < size; i += 4) {
      // 创建金属度变化，形成金属与非金属的过渡区域
      let metalness;
      
      // 添加一些随机的金属纹理图案
      const x = (i / 4) % width;
      const y = Math.floor((i / 4) / width);
      
      // 创建一些条纹或图案
      const pattern = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.5 + 0.5;
      metalness = Math.min(1.0, Math.max(0.7, pattern + Math.random() * 0.3));
      
      // 设置RGBA值
      data[i] = metalness;     // R
      data[i + 1] = metalness; // G
      data[i + 2] = metalness; // B
      data[i + 3] = 1.0;       // A
    }
    
    // 创建纹理并使用加载管理器
    const texture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    
    // 手动触发加载管理器的进度更新
    if (loadingManager) {
      loadingManager.itemStart('metalness-texture');
      setTimeout(() => {
        loadingManager.itemEnd('metalness-texture');
      }, 120);
    }
    
    texture.needsUpdate = true;
    return texture;
  };
  
  // 创建几何体 - 优化版本
  const createGeometries = () => {
    if (!scene) return;
    
    try {
      // 极度简化几何体，使用最低细分度
      const geometryTypes = [
        new THREE.BoxGeometry(5, 5, 5, 1, 1, 1), // 立方体 - 最低细分
        new THREE.SphereGeometry(3, 8, 6), // 球体 - 极低细分
        new THREE.ConeGeometry(3, 6, 8, 1), // 圆锥 - 极低径向细分
        new THREE.OctahedronGeometry(3, 0), // 八面体 - 无细分
        new THREE.TetrahedronGeometry(3, 0) // 四面体 - 无细分
      ];
      
      // 为所有几何体添加法线计算，但移除切线计算
      geometryTypes.forEach(geometry => {
        geometry.computeVertexNormals();
      });
      
      // 创建极简科技材质 - 最大化性能
      const createTechMaterial = (color) => {
        // 完全移除纹理，使用纯色材质
        const material = new THREE.MeshLambertMaterial({ 
          color: color,
          emissive: 0x000000,
          emissiveIntensity: 0.05,
          side: THREE.FrontSide, // 只渲染正面
          flatShading: true // 使用平面着色进一步减少计算
        });
        
        // 将材质添加到科技材质数组中
        techMaterials.push(material);
        
        return material;
      };
      
      // 极简颜色 - 只使用一种颜色
      const techColors = [
        0x0088ff, // 蓝色
      ];
      
      // 创建科技感材质
      const materials = techColors.map(color => createTechMaterial(color));
      
      // 极度减少几何体数量从15个到8个
      for (let i = 0; i < 8; i++) {
        // 随机几何体和材质
        const geometryIndex = Math.floor(Math.random() * geometryTypes.length);
        
        // 克隆几何体，共享材质以减少材质状态切换
        const geometry = geometryTypes[geometryIndex].clone();
        const material = materials[0]; // 使用同一种材质
        
        // 固定缩放比例
        const scale = 1.0;
        
        // 创建网格
        const mesh = new THREE.Mesh(geometry, material);
        
        // 固定位置，减少随机性
        const angle = (i / 8) * Math.PI * 2; // 均匀分布在圆周上
        const radius = 30;
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.z = Math.sin(angle) * radius;
        mesh.position.y = 20; // 固定高度
        
        // 固定旋转
        mesh.rotation.y = Math.random() * Math.PI * 2;
        
        // 应用缩放
        mesh.scale.set(scale, scale, scale);
        
        // 阴影设置 - 只有一半的物体投射阴影
        mesh.castShadow = i % 2 === 0;
        mesh.receiveShadow = true;
        
        // 移除自定义阴影材质
        
        // 极简动画属性
        mesh.userData.rotationSpeed = {
          y: 0.002 // 固定旋转速度
        };
        
        // 极简物理属性
        mesh.userData.velocity = new THREE.Vector3(0, 0, 0);
        mesh.userData.mass = 5; // 固定质量
        mesh.userData.restitution = 0.5; // 固定弹性系数
        mesh.userData.colliding = false;
        mesh.userData.originalColor = new THREE.Color(0x0088ff);
        mesh.userData.originalEmissive = new THREE.Color(0x000000);
        
        // 简化包围球创建
        geometry.computeBoundingSphere();
        mesh.userData.boundingSphere = new THREE.Sphere(
          mesh.position.clone(),
          geometry.boundingSphere.radius * scale
        );
        
        // 添加到场景和数组
        scene.add(mesh);
        geometries.push(mesh);
      }
    } catch (error) {
      console.error('Error creating geometries:', error);
    }
  };
  
  // 增强安全的碰撞检测函数 - 修复错误并优化性能
  const checkCollisions = () => {
    // 多重安全检查：确保几何体数组存在且有效
    if (!geometries || !Array.isArray(geometries) || geometries.length < 2) {
      return;
    }
    
    try {
      // 只检查部分几何体，避免O(n²)复杂度
      // 最多检查2对几何体，进一步减少计算量
      const maxPairs = Math.min(2, Math.floor(geometries.length / 2));
      
      for (let i = 0; i < maxPairs; i++) {
        // 选择相邻的两个几何体
        const index1 = i * 2;
        const index2 = i * 2 + 1;
        
        // 安全检查：确保索引有效
        if (index2 >= geometries.length || index1 < 0) break;
        
        // 安全获取网格
        const meshA = geometries[index1];
        const meshB = geometries[index2];
        
        // 多重安全检查：确保两个网格及其所有必要属性都存在
        if (!meshA || !meshB || 
            !meshA.userData || !meshB.userData || 
            !meshA.position || !meshB.position || 
            typeof meshA.position.distanceTo !== 'function') {
          continue;
        }
        
        try {
          // 重置碰撞状态
          meshA.userData.colliding = false;
          meshB.userData.colliding = false;
          
          // 使用简单的距离检查代替包围球
          // 这样可以避免包围球相关的错误
          const distance = meshA.position.distanceTo(meshB.position);
          
          // 使用固定的碰撞阈值
          const collisionThreshold = 10; // 固定值，避免依赖包围球半径
          
          if (distance < collisionThreshold) {
            // 碰撞处理 - 极简化，只标记碰撞状态
            meshA.userData.colliding = true;
            meshB.userData.colliding = true;
          }
        } catch (innerError) {
          // 忽略单对几何体的碰撞检测错误
          // 这样即使一对几何体检测失败，其他几何体仍然可以继续检测
          continue;
        }
      }
    } catch (error) {
      // 完全忽略碰撞检测错误，不输出日志
      // 这样可以避免控制台被错误消息刷屏
    }
  };
  
  // Handle collision physics between two meshes
  const handleCollision = (meshA, meshB) => {
    try {
      // Ensure both meshes have valid positions
      if (!meshA.position || !meshB.position) return;
      
      // Calculate collision normal
      const normal = new THREE.Vector3().subVectors(meshB.position, meshA.position).normalize();
      
      // Calculate relative velocity
      const relativeVelocity = new THREE.Vector3().subVectors(
        meshB.userData.velocity,
        meshA.userData.velocity
      );
      
      // Calculate relative velocity along the normal
      const velocityAlongNormal = relativeVelocity.dot(normal);
      
      // If objects are moving away from each other, no collision response needed
      if (velocityAlongNormal > 0) return;
      
      // Calculate restitution (bounciness)
      const restitution = Math.min(meshA.userData.restitution, meshB.userData.restitution);
      
      // Calculate impulse scalar
      let impulseScalar = -(1 + restitution) * velocityAlongNormal;
      impulseScalar /= (1 / meshA.userData.mass) + (1 / meshB.userData.mass);
      
      // Apply impulse - safely
      try {
        const impulse = normal.clone().multiplyScalar(impulseScalar);
        
        if (meshA.userData.velocity && typeof meshA.userData.velocity.sub === 'function') {
          meshA.userData.velocity.sub(impulse.clone().multiplyScalar(1 / meshA.userData.mass));
        }
        
        if (meshB.userData.velocity && typeof meshB.userData.velocity.add === 'function') {
          meshB.userData.velocity.add(impulse.clone().multiplyScalar(1 / meshB.userData.mass));
        }
      } catch (err) {
        console.error('Error applying impulse in collision:', err);
      }
      
      // Add a bit of random motion for more interesting behavior
      meshA.userData.velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ));
      
      meshB.userData.velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ));
      
      // Slightly separate the objects to prevent sticking
      // Ensure both meshes have valid positions and bounding spheres
      try {
        if (meshA.position && meshB.position && 
            typeof meshA.position.distanceTo === 'function' &&
            typeof meshA.position.sub === 'function' &&
            typeof meshB.position.add === 'function' &&
            meshA.userData && meshA.userData.boundingSphere && 
            meshB.userData && meshB.userData.boundingSphere) {
          const penetrationDepth = (meshA.userData.boundingSphere.radius + meshB.userData.boundingSphere.radius) - 
                                 meshA.position.distanceTo(meshB.position);
          const correction = normal.clone().multiplyScalar(penetrationDepth * 0.5);
          
          meshA.position.sub(correction);
          meshB.position.add(correction);
        }
      } catch (err) {
        console.error('Error separating objects after collision:', err);
      }
    } catch (error) {
      console.error('Error handling collision:', error);
    }
  };
  
  // 极度简化的鼠标指示器
  const createMouseIndicator = () => {
    if (!scene) return;
    
    try {
      // 创建极简环形几何体，减少分段数
      const ringGeometry = new THREE.RingGeometry(1.5, 2, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.FrontSide, // 只渲染正面
        transparent: true,
        opacity: 0.6,
        depthTest: false
      });
      
      // 创建极简内圆，减少分段数
      const circleGeometry = new THREE.CircleGeometry(0.8, 8);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide, // 只渲染正面
        transparent: true,
        opacity: 0.4,
        depthTest: false
      });
      
      // 创建网格
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      
      // 创建组
      mouseIndicator = new THREE.Group();
      mouseIndicator.add(ring);
      
      // 固定位置
      mouseIndicator.position.z = -10;
      
      // 添加到相机
      camera.add(mouseIndicator);
    } catch (error) {
      console.error('Mouse indicator error');
    }
  };
  
  // 增强安全的鼠标移动处理 - 修复错误并优化性能
  const onMouseMove = (event) => {
    // 多重安全检查：确保所有必要对象存在
    if (!renderer || !renderer.domElement || !renderer.domElement.parentElement ||
        !event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
      return;
    }
    
    try {
      const container = renderer.domElement.parentElement;
      if (!container) return;
      
      // 安全获取容器边界
      let containerRect;
      try {
        containerRect = container.getBoundingClientRect();
        if (!containerRect || typeof containerRect.left !== 'number') return;
      } catch (err) {
        return; // 如果无法获取边界，安全退出
      }
      
      // 检查鼠标是否在容器范围内
      if (
        event.clientX >= containerRect.left && 
        event.clientX <= containerRect.right && 
        event.clientY >= containerRect.top && 
        event.clientY <= containerRect.bottom
      ) {
        // 安全初始化或更新鼠标位置
        if (!mouseScreenPosition || typeof mouseScreenPosition.x !== 'number') {
          try {
            mouseScreenPosition = new THREE.Vector2();
          } catch (err) {
            return; // 如果无法创建向量，安全退出
          }
        }
        
        // 安全更新鼠标位置
        try {
          mouseScreenPosition.x = ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
          mouseScreenPosition.y = -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
        } catch (err) {
          return; // 如果计算出错，安全退出
        }
        
        // 安全检查：确保射线投射器和相机存在
        if (!raycaster || !camera || typeof raycaster.setFromCamera !== 'function') return;
        
        // 每8帧才更新射线投射器和交互检测，进一步减少计算
        const currentFrame = Math.floor(Date.now() / 16.67); // 估算当前帧数
        if (currentFrame % 8 === 0) {
          // 安全更新射线投射器
          try {
            raycaster.setFromCamera(mouseScreenPosition, camera);
          } catch (err) {
            return; // 如果设置射线出错，安全退出
          }
          
          // 只在非拖拽状态下检查交互
          if (!isDragging && geometries && Array.isArray(geometries) && geometries.length > 0) {
            // 限制检测的几何体数量
            const maxObjectsToCheck = 3; // 减少到最多3个
            const objectsToCheck = geometries.slice(0, Math.min(geometries.length, maxObjectsToCheck));
            
            // 安全获取交点
            let intersects = [];
            try {
              intersects = raycaster.intersectObjects(objectsToCheck);
              if (!Array.isArray(intersects)) intersects = [];
            } catch (err) {
              intersects = []; // 如果交点计算出错，使用空数组
            }
            
            // 安全重置之前的交互对象
            if (intersectedObject && (!intersects.length || intersects[0].object !== intersectedObject)) {
              // 安全更新光标样式
              try {
                if (renderer.domElement.style) {
                  renderer.domElement.style.cursor = 'default';
                }
              } catch (err) {
                // 忽略光标样式错误
              }
              
              // 安全更新鼠标指示器颜色
              try {
                if (mouseIndicator && mouseIndicator.children && 
                    mouseIndicator.children[0] && 
                    mouseIndicator.children[0].material && 
                    mouseIndicator.children[0].material.color && 
                    typeof mouseIndicator.children[0].material.color.set === 'function') {
                  mouseIndicator.children[0].material.color.set(0x00ffff);
                }
              } catch (err) {
                // 忽略指示器颜色错误
              }
            }
            
            // 安全处理新的交互
            if (intersects.length > 0 && intersects[0].object) {
              intersectedObject = intersects[0].object;
              
              // 安全更新光标样式
              try {
                if (renderer.domElement.style) {
                  renderer.domElement.style.cursor = 'grab';
                }
              } catch (err) {
                // 忽略光标样式错误
              }
              
              // 安全更新鼠标指示器颜色
              try {
                if (mouseIndicator && mouseIndicator.children && 
                    mouseIndicator.children[0] && 
                    mouseIndicator.children[0].material && 
                    mouseIndicator.children[0].material.color && 
                    typeof mouseIndicator.children[0].material.color.set === 'function') {
                  mouseIndicator.children[0].material.color.set(0xff00ff);
                }
              } catch (err) {
                // 忽略指示器颜色错误
              }
            } else {
              intersectedObject = null;
            }
          }
        }
        
        // 安全处理拖拽
        if (isDragging && selectedObject && 
            selectedObject.position && typeof selectedObject.position.copy === 'function' && 
            dragPlane && typeof dragPlane.setFromNormalAndCoplanarPoint === 'function' && 
            camera && typeof camera.getWorldDirection === 'function' && 
            raycaster && raycaster.ray && typeof raycaster.ray.intersectPlane === 'function' && 
            dragOffset && typeof dragOffset.copy === 'function') {
          
          try {
            // 创建临时向量用于获取相机方向
            const tempVector = new THREE.Vector3();
            
            // 更新拖拽平面
            dragPlane.setFromNormalAndCoplanarPoint(
              camera.getWorldDirection(tempVector),
              selectedObject.position
            );
            
            // 投射射线找到平面上的点
            const intersectPoint = new THREE.Vector3();
            const didIntersect = raycaster.ray.intersectPlane(dragPlane, intersectPoint);
            
            if (didIntersect && 
                typeof intersectPoint.sub === 'function' && 
                typeof selectedObject.position.copy === 'function') {
              // 安全移动对象 - 创建临时向量避免修改原始向量
              const targetPosition = intersectPoint.clone().sub(dragOffset);
              selectedObject.position.copy(targetPosition);
            }
          } catch (err) {
            // 忽略拖拽错误
          }
        }
      }
    } catch (error) {
      // 忽略所有鼠标处理错误
    }
  };
  
  // 增强安全的鼠标按下处理
  const onMouseDown = (event) => {
    // 多重安全检查：确保所有必要对象存在
    if (!renderer || !renderer.domElement || !camera || 
        !event || event.button !== 0 || !raycaster || !raycaster.ray) {
      return; // 只处理左键，且确保必要对象存在
    }
    
    try {
      // 如果有交互对象，选择它进行拖拽
      if (intersectedObject && intersectedObject.position) {
        selectedObject = intersectedObject;
        isDragging = true;
        
        // 安全更改光标
        try {
          if (renderer.domElement.style) {
            renderer.domElement.style.cursor = 'grabbing';
          }
        } catch (err) {
          // 忽略光标样式错误
        }
        
        // 安全禁用轨道控制器
        if (controls && typeof controls.enabled !== 'undefined') {
          controls.enabled = false;
        }
        
        // 安全存储初始位置
        if (dragStartPosition && typeof dragStartPosition.copy === 'function' && 
            selectedObject.position) {
          dragStartPosition.copy(selectedObject.position);
        }
        
        // 安全创建拖拽平面
        if (dragPlane && typeof dragPlane.setFromNormalAndCoplanarPoint === 'function' && 
            typeof camera.getWorldDirection === 'function' && dragPlane.normal) {
          try {
            dragPlane.setFromNormalAndCoplanarPoint(
              camera.getWorldDirection(new THREE.Vector3()),
              selectedObject.position
            );
          } catch (err) {
            // 忽略拖拽平面错误
          }
        }
        
        // 安全计算偏移量
        if (typeof raycaster.ray.intersectPlane === 'function' && 
            dragOffset && typeof dragOffset.copy === 'function' && 
            typeof dragOffset.sub === 'function') {
          try {
            const intersectPoint = new THREE.Vector3();
            const didIntersect = raycaster.ray.intersectPlane(dragPlane, intersectPoint);
            
            if (didIntersect) {
              dragOffset.copy(intersectPoint).sub(selectedObject.position);
            }
          } catch (err) {
            // 忽略偏移量计算错误
            // 重置拖拽状态
            dragOffset.set(0, 0, 0);
          }
        }
        
        // 安全更新鼠标指示器
        try {
          if (mouseIndicator && mouseIndicator.children && 
              mouseIndicator.children[0] && mouseIndicator.children[0].material && 
              typeof mouseIndicator.children[0].material.color.set === 'function') {
            mouseIndicator.children[0].material.color.set(0xff0000);
          }
        } catch (err) {
          // 忽略指示器颜色错误
        }
      }
    } catch (error) {
      // 忽略鼠标按下错误
      // 确保拖拽状态被重置
      isDragging = false;
      selectedObject = null;
    }
  };
  
  // 增强安全的鼠标释放处理
  const onMouseUp = (event) => {
    // 安全检查：确保事件有效
    if (!event || event.button !== 0) return; // 只处理左键
    
    try {
      // 安全检查：确保拖拽状态和对象有效
      if (isDragging) {
        // 重置拖拽状态
        isDragging = false;
        
        // 安全更改光标
        try {
          if (renderer && renderer.domElement && renderer.domElement.style) {
            renderer.domElement.style.cursor = intersectedObject ? 'grab' : 'default';
          }
        } catch (err) {
          // 忽略光标样式错误
        }
        
        // 安全重新启用轨道控制器
        if (controls && typeof controls.enabled !== 'undefined') {
          controls.enabled = true;
        }
        
        // 安全重置鼠标指示器
        try {
          if (mouseIndicator && mouseIndicator.children && 
              mouseIndicator.children[0] && mouseIndicator.children[0].material && 
              typeof mouseIndicator.children[0].material.color.set === 'function') {
            mouseIndicator.children[0].material.color.set(
              intersectedObject ? 0xff00ff : 0x00ffff
            );
          }
        } catch (err) {
          // 忽略指示器颜色错误
        }
      }
      
      // 清除选中对象
      selectedObject = null;
    } catch (error) {
      // 忽略鼠标释放错误
      // 确保状态被重置
      isDragging = false;
      selectedObject = null;
      
      // 确保控制器被重新启用
      if (controls) {
        controls.enabled = true;
      }
    }
  };
  
  // 极度简化的点击事件处理
  const onClick = (event) => {
    if (!intersectedObject || isDragging) return;
    
    try {
      // 只添加固定的Y轴旋转，完全移除物理效果
      if (intersectedObject.userData) {
        intersectedObject.userData.rotationSpeed = {
          x: 0,
          y: 0.02,
          z: 0
        };
      }
    } catch (error) {
      console.error('Click error');
    }
  };
  
  // Drag event handlers for DragControls
  const onDragStart = (event) => {
    // This is handled by our custom onMouseDown
  };
  
  const onDrag = (event) => {
    // This is handled by our custom onMouseMove
  };
  
  const onDragEnd = (event) => {
    // This is handled by our custom onMouseUp
  };
  
  // 极度简化的窗口调整大小处理
  const onWindowResize = () => {
    if (!renderer || !renderer.domElement || !renderer.domElement.parentElement) {
      return;
    }
    
    try {
      // 获取容器尺寸
      const container = renderer.domElement.parentElement;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // 更新相机
      if (camera) {
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();
      }
      
      // 更新渲染器尺寸
      renderer.setSize(containerWidth, containerHeight);
      
      // 更新后处理效果的大小（如果存在）
      if (composer) {
        composer.setSize(containerWidth, containerHeight);
      }
    } catch (error) {
      console.error('Resize error');
    }
  };
  
  // 极度简化的科技环境创建
  const createTechEnvironment2 = () => {
    if (!scene) return;
    
    try {
      // 添加极简网格地面 - 减少网格线数量
      gridHelper = new THREE.GridHelper(200, 20, 0x00ffff, 0x0088ff);
      gridHelper.position.y = 0.1;
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);
      
      // 完全移除坐标轴辅助
      
      // 设置固定背景色，完全跳过HDR环境贴图加载
      scene.background = new THREE.Color(0x000811); // 深蓝黑色背景
      
      // 创建简单的立方体环境贴图代替HDR
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128); // 极低分辨率
      cubeRenderTarget.texture.type = THREE.HalfFloatType; // 使用半精度浮点数
      scene.environment = cubeRenderTarget.texture;
    } catch (error) {
      console.error('Environment error');
    }
  };
  
  // 创建粒子系统2
  const createParticleSystem2 = () => {
    if (!scene) return;
    
    try {
      // 创建粒子几何体
      const particlesGeometry = new THREE.BufferGeometry();
      const particleCount = 2000;
      
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      const color = new THREE.Color();
      
      for (let i = 0; i < particleCount; i++) {
        // 位置 - 在较大范围内随机分布
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = Math.random() * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        
        // 颜色 - 使用科技感颜色
        const colorChoice = Math.random();
        if (colorChoice < 0.3) {
          color.setHSL(0.6, 1, 0.5); // 蓝色
        } else if (colorChoice < 0.6) {
          color.setHSL(0.5, 1, 0.5); // 青色
        } else if (colorChoice < 0.9) {
          color.setHSL(0.8, 1, 0.5); // 紫色
        } else {
          color.setHSL(0.1, 1, 0.5); // 绿色
        }
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // 大小 - 随机但较小
        sizes[i] = Math.random() * 2;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      // 创建粒子材质
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.5,
        sizeAttenuation: true,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        vertexColors: true,
        blending: THREE.AdditiveBlending
      });
      
      // 创建粒子系统
      particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particleSystem);
    } catch (error) {
      console.error('Error creating particle system:', error);
    }
  };
  
  // 创建全息投影效果2
  const createHologramEffect2 = () => {
    if (!scene) return;
    
    try {
      hologramGroup = new THREE.Group();
      
      // 创建多个环形
      for (let i = 0; i < 5; i++) {
        const radius = 15 + i * 3;
        const hologramRing = new THREE.Mesh(
          new THREE.RingGeometry(radius, radius + 0.2, 64),
          new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          })
        );
        hologramRing.rotation.x = Math.PI / 2;
        hologramRing.position.y = 0.2;
        hologramGroup.add(hologramRing);
      }
      
      // 创建垂直扫描线
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 30),
          new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          })
        );
        line.position.set(
          Math.cos(angle) * 15,
          15,
          Math.sin(angle) * 15
        );
        line.rotation.y = angle;
        hologramGroup.add(line);
      }
      
      hologramGroup.position.set(0, 0, 0);
      scene.add(hologramGroup);
    } catch (error) {
      console.error('Error creating hologram effect:', error);
    }
  };
  
  // 创建扫描线效果2
  const createScanLine2 = () => {
    if (!scene) return;
    
    try {
      // 创建扫描线平面
      scanLine = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 0.5),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        })
      );
      scanLine.rotation.x = Math.PI / 2;
      scanLine.position.y = 0.5;
      scene.add(scanLine);
    } catch (error) {
      console.error('Error creating scan line:', error);
    }
  };
  
  // 安全优化的主动画循环 - 修复错误并最大化性能
  const animate = () => {
    // 安全检查：确保所有必要的对象都存在
    if (!scene || !camera || !renderer || !clock) {
      return;
    }
    
    try {
      // 请求下一帧动画
      animationFrameId = requestAnimationFrame(animate);
      
      // 获取时间增量和总时间
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      
      // 使用更可靠的帧计数方法
      const frameCount = Math.floor(Date.now() / 16.67); // 约60fps
      
      // 更新控制器 - 必须保留
      if (controls && typeof controls.update === 'function') {
        controls.update();
      }
      
      // 安全地更新灯光动画 - 每30帧更新一次
      if (frameCount % 30 === 0 && scene.userData && 
          typeof scene.userData.animateLights === 'function') {
        try {
          scene.userData.animateLights(delta * 30); // 补偿跳过的帧
        } catch (err) {
          // 忽略灯光错误，不影响主要功能
        }
      }
      
      // 安全地更新粒子系统 - 每40帧更新一次
      if (frameCount % 40 === 0 && particleSystem && 
          typeof particleSystem.rotation !== 'undefined' && 
          typeof particleSystem.rotation.y === 'number') {
        try {
          particleSystem.rotation.y += delta * 40 * 0.01; // 大幅减慢旋转速度并补偿跳过的帧
        } catch (err) {
          // 忽略粒子系统错误
        }
      }
      
      // 安全地更新全息投影效果 - 每40帧更新一次
      if (frameCount % 40 === 0 && hologramGroup && 
          typeof hologramGroup.rotation !== 'undefined' && 
          typeof hologramGroup.rotation.y === 'number') {
        try {
          hologramGroup.rotation.y += delta * 40 * 0.05; // 大幅减慢旋转速度并补偿跳过的帧
        } catch (err) {
          // 忽略全息投影错误
        }
      }
      
      // 安全地更新扫描线 - 每30帧更新一次
      if (frameCount % 30 === 0 && scanLine && 
          typeof scanLine.position !== 'undefined' && 
          typeof scanLine.position.z === 'number') {
        try {
          // 移动扫描线，但大幅减慢速度
          scanLinePosition += delta * 30 * 5; // 补偿跳过的帧但大幅减少速度
          if (scanLinePosition > 200) scanLinePosition = -100;
          scanLine.position.z = scanLinePosition;
        } catch (err) {
          // 忽略扫描线错误
        }
      }
      
      // 完全禁用故障效果
      if (glitchPass) {
        glitchPass.enabled = false;
      }
      
      // 安全地更新鼠标指示器 - 每20帧更新一次
      if (frameCount % 20 === 0 && mouseIndicator && 
          mouseIndicator.children && 
          mouseIndicator.children.length > 0 && 
          mouseIndicator.children[0]) {
        try {
          // 固定大小
          if (mouseIndicator.children[0].scale && 
              typeof mouseIndicator.children[0].scale.set === 'function') {
            mouseIndicator.children[0].scale.set(1, 1, 1);
          }
          
          // 极度减少旋转速度
          if (mouseIndicator.children[0].rotation && 
              typeof mouseIndicator.children[0].rotation.z === 'number') {
            mouseIndicator.children[0].rotation.z += delta * 20 * 0.05; // 补偿跳过的帧但大幅减少速度
          }
        } catch (err) {
          // 忽略鼠标指示器错误
        }
      }
      
      // 安全的碰撞检测 - 每15帧检测一次
      if (!isDragging && frameCount % 15 === 0) { // 进一步降低频率
        try {
          checkCollisions();
        } catch (err) {
          // 忽略碰撞检测错误
        }
      }
      
      // 安全地更新几何体 - 每5帧更新一次
      if (frameCount % 5 === 0 && geometries && 
          Array.isArray(geometries) && 
          geometries.length > 0) {
        try {
          // 只更新一个几何体，轮流更新
          const index = (Math.floor(frameCount / 5) % geometries.length);
          const mesh = geometries[index];
          
          if (mesh && mesh.userData && mesh.position) {
            // 只更新旋转 - 完全移除物理模拟
            if (mesh.rotation && 
                mesh.userData.rotationSpeed && 
                typeof mesh.userData.rotationSpeed.y === 'number') {
              mesh.rotation.y += mesh.userData.rotationSpeed.y * 5; // 补偿跳过的帧
            }
            
            // 如果处于碰撞状态，改变颜色
            if (mesh.material && 
                typeof mesh.material.color !== 'undefined' && 
                typeof mesh.material.color.set === 'function' && 
                mesh.userData.colliding === true) {
              // 简单地设置为红色
              mesh.material.color.set(0xff0000);
              mesh.userData.colliding = false; // 重置碰撞状态
            } else if (mesh.material && 
                       mesh.userData.originalColor && 
                       typeof mesh.material.color !== 'undefined' && 
                       typeof mesh.material.color.copy === 'function') {
              // 恢复原始颜色
              mesh.material.color.copy(mesh.userData.originalColor);
            }
          }
        } catch (err) {
          // 忽略几何体更新错误
        }
      }
      
      // 极简环境贴图更新 - 每40帧更新一次
      if (frameCount % 40 === 0 && 
          geometries && Array.isArray(geometries) && geometries.length > 0 && 
          scene && scene.environment) {
        try {
          // 只更新一部分几何体的环境贴图
          const updateCount = Math.min(geometries.length, 2); // 每次最多更新2个几何体
          const startIdx = frameCount % (geometries.length - updateCount + 1); // 循环更新不同部分
          
          for (let i = startIdx; i < startIdx + updateCount; i++) {
            if (i >= geometries.length) break; // 安全检查
            
            const mesh = geometries[i];
            if (mesh && mesh.material && 
                typeof mesh.material.needsUpdate !== 'undefined') {
              mesh.material.envMap = scene.environment;
              mesh.material.envMapIntensity = 0.8; // 进一步降低环境贴图强度
              mesh.material.needsUpdate = true;
            }
          }
        } catch (err) {
          // 忽略环境贴图更新错误
        }
      }
      
      // 渲染场景 - 必须保留
      try {
        if (composer && typeof composer.render === 'function') {
          composer.render();
        } else if (renderer && typeof renderer.render === 'function') {
          renderer.render(scene, camera);
        }
      } catch (renderError) {
        console.error('Render error');
      }
    } catch (error) {
      console.error('Animation error');
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  };
  
  // 极度平滑的相机运镜效果 - 完全消除晃动
  const startCameraIntroAnimation = () => {
    if (!camera) return;
    
    try {
      // 临时禁用轨道控制器
      if (controls) {
        controls.enabled = false;
        // 大幅增加阻尼因子，几乎消除动画结束后的余震
        controls.dampingFactor = 0.5;
        // 减小旋转速度，使相机移动更平稳
        controls.rotateSpeed = 0.5;
        // 增加平移阻尼，减少突然移动
        controls.panSpeed = 0.5;
        // 增加缩放阻尼，减少突然缩放
        controls.zoomSpeed = 0.5;
      }
      
      // 设置相机初始位置（更近的起始点，减少大幅度移动）
      camera.position.set(50, 40, 80); // 减小初始距离
      camera.lookAt(0, 0, 0);
      
      // 创建固定的注视点，避免相机方向突变
      const lookAtTarget = { x: 0, y: 0, z: 0 };
      
      // 创建时间线，添加延迟开始，让场景先稳定
      const timeline = gsap.timeline({
        delay: 0.5, // 添加延迟，让场景先稳定
        onComplete: () => {
          // 动画完成后缓慢启用控制器
          if (controls) {
            // 使用延迟启用控制器，避免突然切换
            setTimeout(() => {
              controls.enabled = true;
            }, 500);
          }
        }
      });
      
      // 使用更平滑的缓动函数
      // 第一段：从初始位置平滑移动到右侧位置，减少路径长度
      timeline.to(camera.position, {
        x: 40, // 减小移动幅度
        y: 35, 
        z: 70,
        duration: 3.0, // 大幅增加持续时间，让动画更平滑
        ease: "power1.inOut", // 使用更平滑的缓动函数
        onUpdate: () => {
          // 始终看向同一个点，避免视角突变
          camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
        }
      });
      
      // 第二段：平滑移动到左侧位置，减少幅度
      timeline.to(camera.position, {
        x: -20, // 减小移动幅度
        y: 32,
        z: 65,
        duration: 3.0, // 大幅增加持续时间
        ease: "power1.inOut", // 使用更平滑的缓动函数
        onUpdate: () => {
          camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
        }
      });
      
      // 第三段：最终移动到正面位置，减少幅度
      timeline.to(camera.position, {
        x: 0,
        y: 30,
        z: 60,
        duration: 2.5, // 大幅增加持续时间
        ease: "power1.inOut", // 使用更平滑的缓动函数
        onUpdate: () => {
          camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
        }
      });
      
      // 添加一个微小的最终调整，确保完全稳定
      timeline.to(camera.position, {
        x: 0,
        y: 30,
        z: 60,
        duration: 1.0,
        ease: "power4.out", // 使用强力缓出函数作为最终稳定
        onUpdate: () => {
          camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
        }
      });
    } catch (error) {
      // 出错时直接设置到最终位置，但使用GSAP以避免突变
      gsap.to(camera.position, {
        x: 0,
        y: 30,
        z: 60,
        duration: 1.0,
        ease: "power2.out",
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
        },
        onComplete: () => {
          if (controls) {
            controls.enabled = true;
          }
        }
      });
    }
  };
  
  // Clean up resources
  const cleanup = () => {
    try {
      // Clean up event listeners
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        renderer.domElement.removeEventListener('click', onClick);
      }
      
      // Kill any active GSAP animations
      gsap.killTweensOf(camera.position);
      
      // Stop animation loop
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // 清理科技感材质
      if (techMaterials && techMaterials.length > 0) {
        techMaterials.forEach(material => {
          if (material) material.dispose();
        });
        techMaterials = [];
      }
      
      // 清理粒子系统
      if (particleSystem) {
        if (particleSystem.geometry) particleSystem.geometry.dispose();
        if (particleSystem.material) particleSystem.material.dispose();
        if (scene) scene.remove(particleSystem);
        particleSystem = null;
      }
      
      // 清理网格地面
      if (gridHelper) {
        if (scene) scene.remove(gridHelper);
        gridHelper = null;
      }
      
      // 清理全息投影效果
      if (hologramGroup) {
        if (hologramGroup.children && hologramGroup.children.length > 0) {
          hologramGroup.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        }
        if (scene) scene.remove(hologramGroup);
        hologramGroup = null;
      }
      
      // 清理扫描线
      if (scanLine) {
        if (scanLine.geometry) scanLine.geometry.dispose();
        if (scanLine.material) scanLine.material.dispose();
        if (scene) scene.remove(scanLine);
        scanLine = null;
      }
      
      // 清理后处理效果
      if (filmPass) filmPass = null;
      if (glitchPass) glitchPass = null;
      if (halftonePass) halftonePass = null;
      
      // Dispose of Three.js resources
      if (plane && plane.geometry) {
        plane.geometry.dispose();
        if (plane.material) {
          if (Array.isArray(plane.material)) {
            plane.material.forEach(material => material.dispose());
          } else {
            // 特别处理Reflector材质
            if (plane instanceof Reflector && plane.material.uniforms) {
              // 清理Reflector特有的纹理资源
              if (plane.material.uniforms.tDiffuse && plane.material.uniforms.tDiffuse.value) {
                plane.material.uniforms.tDiffuse.value.dispose();
              }
              // 清理其他可能的纹理资源
              Object.values(plane.material.uniforms).forEach(uniform => {
                if (uniform.value && uniform.value.isTexture) {
                  uniform.value.dispose();
                }
              });
            }
            plane.material.dispose();
          }
        }
        
        // 清理Reflector相关资源
        if (plane instanceof Reflector) {
          // Reflector的特殊清理已在上面处理
        } else if (plane.userData && plane.userData.updateReflection) {
          // 兼容旧代码：清理CubeCamera（如果存在）
          scene.children.forEach(child => {
            if (child instanceof THREE.CubeCamera) {
              if (child.renderTarget) {
                child.renderTarget.dispose();
              }
              scene.remove(child);
            }
          });
          
          // 移除引用
          plane.userData.updateReflection = null;
        }
        
        if (scene) scene.remove(plane);
        plane = null;
      }
      
      if (geometries && geometries.length > 0) {
        geometries.forEach((mesh) => {
          if (mesh) {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
            if (scene) scene.remove(mesh);
          }
        });
        geometries = [];
      }
      
      if (controls) {
        controls.dispose();
        controls = null;
      }
      
      if (renderer) {
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer = null;
      }
      
      // Clear other references
      if (scene) {
        // Dispose of any remaining objects in the scene
        while(scene.children.length > 0) { 
          const object = scene.children[0];
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
          scene.remove(object); 
        }
        scene = null;
      }
      
      camera = null;
      clock = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };
  
  return {
    init,
    cleanup,
    getLoadingProgress
  };
}