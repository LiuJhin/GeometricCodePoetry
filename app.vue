<template>
  <div class="app-container">
    <LoadingScreen 
      :progress="loadingProgress" 
      @complete="onLoadingComplete" 
      v-if="!loadingComplete"
    />
    <NuxtPage v-show="loadingComplete" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import useGeometryScene from '~/composables/useGeometryScene';

// 获取几何场景
const geometryScene = useGeometryScene();

// 加载状态
const loadingProgress = ref(0);
const loadingComplete = ref(false);

// 监听实际资源加载进度
onMounted(() => {
  // 初始化场景（不可见）
  const dummyContainer = document.createElement('div');
  dummyContainer.style.position = 'absolute';
  dummyContainer.style.opacity = '0';
  dummyContainer.style.pointerEvents = 'none';
  dummyContainer.style.width = '100px';
  dummyContainer.style.height = '100px';
  document.body.appendChild(dummyContainer);
  
  // 初始化场景以触发资源加载
  geometryScene.init(dummyContainer);
  
  // 定时检查加载进度
  const progressInterval = setInterval(() => {
    const progress = geometryScene.getLoadingProgress();
    loadingProgress.value = progress;
    
    // 如果加载完成，清除定时器
    if (progress === 100) {
      clearInterval(progressInterval);
      console.log('加载完成，进度达到100%');
    }
  }, 100);
  
  // 如果5秒后仍未加载完成，确保进度至少达到95%
  setTimeout(() => {
    if (loadingProgress.value < 95) {
      loadingProgress.value = 95;
    }
  }, 5000);
  
  // 如果10秒后仍未加载完成，将进度提高到99%
  setTimeout(() => {
    if (loadingProgress.value < 99) {
      loadingProgress.value = 99;
    }
  }, 10000);
  
  // 如果15秒后仍未加载完成，强制完成加载
  setTimeout(() => {
    if (loadingProgress.value < 100) {
      console.log('加载超时，强制完成');
      loadingProgress.value = 100;
    }
  }, 15000);
});

// 加载完成回调
const onLoadingComplete = () => {
  console.log('加载完成回调被触发');
  loadingComplete.value = true;
  
  // 清理不可见容器
  const dummyContainer = document.querySelector('div[style*="opacity: 0"]');
  if (dummyContainer) {
    console.log('清理不可见容器');
    document.body.removeChild(dummyContainer);
  } else {
    console.log('未找到不可见容器');
  }
  
  // 确保加载进度为100%
  loadingProgress.value = 100;
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Inter", sans-serif;
}

body {
  overflow-x: hidden;
  background-color: #050505;
  color: #ffffff;
}

.app-container {
  width: 100%;
  min-height: 100vh;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: #050505;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
