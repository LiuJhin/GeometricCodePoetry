import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { gsap } from 'gsap';

export default function useGeometryScene() {
  // Three.js variables
  let scene, camera, renderer, clock, controls, dragControls;
  let plane, geometries = [];
  let mouseX = 0, mouseY = 0;
  let windowHalfX, windowHalfY;
  let animationFrameId = null;
  
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
  
  // Initialize Three.js scene
  const init = (container) => {
    if (!container) {
      console.error('Container is null or undefined');
      return;
    }
    
    try {
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
      
      // Set up renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerWidth, containerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      
      // Set up orbit controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.autoRotate = false; // Disabled auto-rotation for better interaction
      controls.autoRotateSpeed = 0.5;
      
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
      
      // Add lights
      addLights();
      
      // Create plane
      createPlane();
      
      // Create various geometries
      createGeometries();
      
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
  
  // Add enhanced lights to the scene
  const addLights = () => {
    if (!scene) return;
    
    try {
      // Ambient light - 显著增强环境光亮度
      const ambientLight = new THREE.AmbientLight(0x606060, 1.8);
      scene.add(ambientLight);
      
      // Main directional light (sun-like) with improved shadows - 增强强度
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(50, 100, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 4096; // Higher resolution shadows
      directionalLight.shadow.mapSize.height = 4096;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 1000;
      directionalLight.shadow.camera.left = -200;
      directionalLight.shadow.camera.right = 200;
      directionalLight.shadow.camera.top = 200;
      directionalLight.shadow.camera.bottom = -200;
      directionalLight.shadow.bias = -0.0001; // Reduce shadow acne
      scene.add(directionalLight);
      
      // Add a helper to visualize the light direction (optional)
      // const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 10);
      // scene.add(directionalLightHelper);
      
      // Enhanced colored point lights with shadows - 增强强度和范围
      const pointLight1 = new THREE.PointLight(0x00ffff, 4, 200);
      pointLight1.position.set(30, 40, 30);
      pointLight1.castShadow = true;
      pointLight1.shadow.mapSize.width = 1024;
      pointLight1.shadow.mapSize.height = 1024;
      scene.add(pointLight1);
      
      // Add light helper for debugging (optional)
      // const pointLightHelper1 = new THREE.PointLightHelper(pointLight1, 5);
      // scene.add(pointLightHelper1);
      
      const pointLight2 = new THREE.PointLight(0xff00ff, 4, 200);
      pointLight2.position.set(-30, 40, -30);
      pointLight2.castShadow = true;
      pointLight2.shadow.mapSize.width = 1024;
      pointLight2.shadow.mapSize.height = 1024;
      scene.add(pointLight2);
      
      // Add a warm spotlight for dramatic effect - 增强强度和范围
      const spotLight = new THREE.SpotLight(0xff9900, 5, 300, Math.PI / 6, 0.5, 1);
      spotLight.position.set(0, 100, 0);
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      scene.add(spotLight);
      
      // Create a target for the spotlight to aim at
      const spotLightTarget = new THREE.Object3D();
      spotLightTarget.position.set(0, 0, 0);
      scene.add(spotLightTarget);
      spotLight.target = spotLightTarget;
      
      // Add a stronger hemisphere light for more natural lighting
      const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.0);
      scene.add(hemisphereLight);
      
      // 添加额外的点光源增强整体亮度
      const pointLight3 = new THREE.PointLight(0xffffff, 3, 200);
      pointLight3.position.set(0, 80, 0);
      scene.add(pointLight3);
      
      // Add fog to the scene for depth
      scene.fog = new THREE.FogExp2(0x000000, 0.002);
    } catch (error) {
      console.error('Error adding lights:', error);
    }
  };
  
  // Create a plane for the ground that covers the entire screen
  const createPlane = () => {
    if (!scene) return;
    
    try {
      // Create a much larger plane to ensure it covers the entire view
      const planeGeometry = new THREE.PlaneGeometry(1500, 1500, 50, 50);
      
      // Create the main plane with a gradient material
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.7,
        metalness: 0.3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      
      plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = Math.PI / 2; // Rotate to be horizontal
      plane.position.y = -5; // Lower position to ensure objects are above it
      plane.receiveShadow = true;
      
      // Add a subtle ambient occlusion texture
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        'https://threejs.org/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg',
        function(texture) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(20, 20); // Increased repeat for larger plane
          planeMaterial.map = texture;
          planeMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
          console.error('Error loading texture:', err);
        }
      );
      
      scene.add(plane);
    } catch (error) {
      console.error('Error creating plane:', error);
    }
  };
  
  // Create various geometries with collision detection capabilities
  const createGeometries = () => {
    if (!scene) return;
    
    try {
      // Array of different geometry types
      const geometryTypes = [
        new THREE.BoxGeometry(5, 5, 5),
        new THREE.SphereGeometry(3, 32, 32),
        new THREE.ConeGeometry(3, 6, 32),
        new THREE.TorusGeometry(3, 1, 16, 100),
        new THREE.DodecahedronGeometry(3),
        new THREE.OctahedronGeometry(3),
        new THREE.TetrahedronGeometry(3),
        new THREE.IcosahedronGeometry(3),
        new THREE.TorusKnotGeometry(2, 0.6, 100, 16)
      ];
      
      // Array of different materials with emissive properties for collision effects
      const materials = [
        new THREE.MeshStandardMaterial({ 
          color: 0xff0000, 
          roughness: 0.3, 
          metalness: 0.7,
          emissive: 0x330000
        }),
        new THREE.MeshStandardMaterial({ 
          color: 0x00ff00, 
          roughness: 0.5, 
          metalness: 0.1,
          emissive: 0x003300
        }),
        new THREE.MeshStandardMaterial({ 
          color: 0x0000ff, 
          roughness: 0.2, 
          metalness: 0.8,
          emissive: 0x000033
        }),
        new THREE.MeshPhysicalMaterial({ 
          color: 0xffff00, 
          roughness: 0.1, 
          metalness: 0.9,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          emissive: 0x333300
        }),
        new THREE.MeshPhysicalMaterial({ 
          color: 0xff00ff, 
          roughness: 0.4, 
          metalness: 0.6,
          transmission: 0.5,
          thickness: 2.0,
          emissive: 0x330033
        }),
        new THREE.MeshPhongMaterial({ 
          color: 0x00ffff, 
          shininess: 100,
          specular: 0xffffff,
          emissive: 0x003333
        }),
        new THREE.MeshLambertMaterial({ 
          color: 0xffffff,
          emissive: 0x222222
        }),
        new THREE.MeshToonMaterial({ 
          color: 0xff9900,
          emissive: 0x331100
        }),
        new THREE.MeshNormalMaterial()
      ];
      
      // Create 50 random geometries (increased from 25)
      for (let i = 0; i < 50; i++) {
        // Random geometry and material
        const geometryIndex = Math.floor(Math.random() * geometryTypes.length);
        const materialIndex = Math.floor(Math.random() * materials.length);
        
        // Clone to avoid sharing materials
        const geometry = geometryTypes[geometryIndex].clone();
        const material = materials[materialIndex].clone();
        
        // Random scale
        const scale = 0.5 + Math.random() * 1.5;
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random position on the plane
        mesh.position.x = (Math.random() - 0.5) * 100;
        mesh.position.z = (Math.random() - 0.5) * 100;
        mesh.position.y = Math.random() * 30 + 5; // Above the plane, higher range
        
        // Random rotation
        mesh.rotation.x = Math.random() * Math.PI * 2;
        mesh.rotation.y = Math.random() * Math.PI * 2;
        mesh.rotation.z = Math.random() * Math.PI * 2;
        
        // Apply scale
        mesh.scale.set(scale, scale, scale);
        
        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store animation and physics properties
        mesh.userData.rotationSpeed = {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        };
        mesh.userData.floatSpeed = 0.05 + Math.random() * 0.1;
        mesh.userData.floatHeight = Math.random() * 2;
        mesh.userData.initialY = mesh.position.y;
        
        // Add physics properties for collision
        mesh.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          0,
          (Math.random() - 0.5) * 0.1
        );
        mesh.userData.mass = scale * 10; // Mass based on scale
        mesh.userData.restitution = 0.7 + Math.random() * 0.3; // Bounciness
        mesh.userData.colliding = false; // Track collision state
        // 安全地克隆颜色和发光属性
        try {
          if (mesh.material && mesh.material.color && typeof mesh.material.color.clone === 'function') {
            mesh.userData.originalColor = mesh.material.color.clone();
          } else {
            mesh.userData.originalColor = new THREE.Color(0xffffff);
          }
          
          if (mesh.material && mesh.material.emissive && typeof mesh.material.emissive.clone === 'function') {
            mesh.userData.originalEmissive = mesh.material.emissive.clone();
          } else {
            mesh.userData.originalEmissive = new THREE.Color(0x000000);
          }
        } catch (err) {
          console.error('Error cloning material colors:', err);
          mesh.userData.originalColor = new THREE.Color(0xffffff);
          mesh.userData.originalEmissive = new THREE.Color(0x000000);
        }
        
        // Create a bounding sphere for collision detection
        // Use the geometry's bounding sphere and adjust by scale
        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere.radius * scale;
        // Ensure mesh.position exists and is valid before cloning
        try {
          if (mesh.position && typeof mesh.position.clone === 'function') {
            mesh.userData.boundingSphere = new THREE.Sphere(
              mesh.position.clone(),
              radius
            );
          } else {
            // Fallback to origin if position is undefined or clone is not available
            mesh.userData.boundingSphere = new THREE.Sphere(
              new THREE.Vector3(0, 0, 0),
              radius
            );
          }
        } catch (err) {
          console.error('Error creating bounding sphere:', err);
          // Fallback to origin if any error occurs
          mesh.userData.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0),
            radius
          );
        }
        
        // Add to scene and array
        scene.add(mesh);
        geometries.push(mesh);
      }
    } catch (error) {
      console.error('Error creating geometries:', error);
    }
  };
  
  // Check for collisions between geometries
  const checkCollisions = () => {
    if (!geometries || geometries.length === 0) return;
    
    try {
      // Reset collision states
      geometries.forEach(mesh => {
        if (mesh.userData.colliding) {
          mesh.userData.colliding = false;
          if (mesh.material.emissive) {
            mesh.material.emissive.copy(mesh.userData.originalEmissive);
            mesh.material.needsUpdate = true;
          }
        }
      });
      
      // Check each pair of geometries for collisions
      for (let i = 0; i < geometries.length; i++) {
        const meshA = geometries[i];
        if (!meshA || !meshA.userData || !meshA.userData.boundingSphere || !meshA.position) continue;
        
        // Update bounding sphere position - safely
        try {
          if (meshA.userData.boundingSphere.center && 
              typeof meshA.userData.boundingSphere.center.copy === 'function' && 
              meshA.position) {
            meshA.userData.boundingSphere.center.copy(meshA.position);
          }
        } catch (err) {
          console.error('Error updating meshA bounding sphere position:', err);
        }
        
        for (let j = i + 1; j < geometries.length; j++) {
          const meshB = geometries[j];
          if (!meshB || !meshB.userData || !meshB.userData.boundingSphere || !meshB.position) continue;
          
          // Update bounding sphere position - safely
          try {
            if (meshB.userData.boundingSphere.center && 
                typeof meshB.userData.boundingSphere.center.copy === 'function' && 
                meshB.position) {
              meshB.userData.boundingSphere.center.copy(meshB.position);
            }
          } catch (err) {
            console.error('Error updating meshB bounding sphere position:', err);
          }
          
          // Check for sphere-sphere intersection
          const distance = meshA.position.distanceTo(meshB.position);
          const sumRadii = meshA.userData.boundingSphere.radius + meshB.userData.boundingSphere.radius;
          
          if (distance < sumRadii) {
            // Collision detected!
            handleCollision(meshA, meshB);
            
            // Visual feedback for collision
            if (meshA.material.emissive) {
              meshA.material.emissive.set(0xff0000);
              meshA.material.needsUpdate = true;
            }
            if (meshB.material.emissive) {
              meshB.material.emissive.set(0xff0000);
              meshB.material.needsUpdate = true;
            }
            
            meshA.userData.colliding = true;
            meshB.userData.colliding = true;
          }
        }
      }
    } catch (error) {
      console.error('Error checking collisions:', error);
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
  
  // Create a circular mouse indicator
  const createMouseIndicator = () => {
    if (!scene) return;
    
    try {
      // Create a ring geometry for the mouse indicator
      const ringGeometry = new THREE.RingGeometry(1.5, 2, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthTest: false
      });
      
      // Create inner circle
      const circleGeometry = new THREE.CircleGeometry(0.8, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        depthTest: false
      });
      
      // Create meshes
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      
      // Create a group to hold both parts
      mouseIndicator = new THREE.Group();
      mouseIndicator.add(ring);
      mouseIndicator.add(circle);
      
      // Position in front of the camera
      mouseIndicator.position.z = -10;
      
      // Add to scene
      scene.add(mouseIndicator);
      
      // Make it follow the camera
      camera.add(mouseIndicator);
    } catch (error) {
      console.error('Error creating mouse indicator:', error);
    }
  };
  
  // Handle mouse movement
  const onMouseMove = (event) => {
    if (!renderer || !renderer.domElement || !renderer.domElement.parentElement) {
      return;
    }
    
    try {
      const container = renderer.domElement.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      
      // Check if mouse is within container bounds
      if (
        event.clientX >= containerRect.left && 
        event.clientX <= containerRect.right && 
        event.clientY >= containerRect.top && 
        event.clientY <= containerRect.bottom
      ) {
        // Calculate mouse position relative to container
        mouseX = (event.clientX - containerRect.left - windowHalfX) * 0.05;
        mouseY = (event.clientY - containerRect.top - windowHalfY) * 0.05;
        
        // Update mouse position for raycaster (normalized device coordinates)
        mouseScreenPosition.x = ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
        mouseScreenPosition.y = -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
        
        // Update raycaster
        raycaster.setFromCamera(mouseScreenPosition, camera);
        
        // Check for intersections with objects
        if (!isDragging && geometries.length > 0) {
          const intersects = raycaster.intersectObjects(geometries);
          
          // Reset previously intersected object
          if (intersectedObject && (!intersects.length || intersects[0].object !== intersectedObject)) {
            if (intersectedObject.material.emissive) {
              intersectedObject.material.emissive.copy(intersectedObject.userData.originalEmissive);
              intersectedObject.material.needsUpdate = true;
            }
            // Change cursor back to default
            renderer.domElement.style.cursor = 'default';
            
            // Update mouse indicator color
            if (mouseIndicator) {
              mouseIndicator.children[0].material.color.set(0x00ffff);
            }
          }
          
          // Handle new intersection
          if (intersects.length > 0) {
            intersectedObject = intersects[0].object;
            
            // Highlight the object
            if (intersectedObject.material.emissive) {
              intersectedObject.material.emissive.set(0x00ffff);
              intersectedObject.material.needsUpdate = true;
            }
            
            // Change cursor to indicate draggable
            renderer.domElement.style.cursor = 'grab';
            
            // Update mouse indicator color
            if (mouseIndicator) {
              mouseIndicator.children[0].material.color.set(0xff00ff);
            }
          } else {
            intersectedObject = null;
          }
        }
        
        // Update mouse indicator position during drag
        if (isDragging && selectedObject) {
          // Update the drag plane to match the camera direction
          dragPlane.setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(dragPlane.normal),
            selectedObject.position
          );
          
          // Cast a ray to find where on the plane the mouse is pointing
          const intersects = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
          
          if (intersects) {
            // Move the object, accounting for the initial offset
            selectedObject.position.copy(intersects).sub(dragOffset);
            
            // Update the object's velocity to zero during dragging
            selectedObject.userData.velocity.set(0, 0, 0);
          }
        }
      }
    } catch (error) {
      console.error('Error handling mouse movement:', error);
    }
  };
  
  // Handle mouse down event
  const onMouseDown = (event) => {
    if (!renderer || !camera || event.button !== 0) return; // Only left mouse button
    
    try {
      // If we're hovering over an object, select it for dragging
      if (intersectedObject) {
        selectedObject = intersectedObject;
        isDragging = true;
        
        // Change cursor to grabbing
        renderer.domElement.style.cursor = 'grabbing';
        
        // Disable orbit controls during drag
        controls.enabled = false;
        
        // Store the initial position
        dragStartPosition.copy(selectedObject.position);
        
        // Create a drag plane perpendicular to the camera
        dragPlane.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(dragPlane.normal),
          selectedObject.position
        );
        
        // Calculate the offset between the object position and the mouse position on the plane
        const intersects = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
        if (intersects) {
          dragOffset.copy(intersects).sub(selectedObject.position);
        }
        
        // Update mouse indicator
        if (mouseIndicator) {
          mouseIndicator.children[0].material.color.set(0xff0000);
          mouseIndicator.scale.set(1.2, 1.2, 1.2);
        }
      }
    } catch (error) {
      console.error('Error handling mouse down:', error);
    }
  };
  
  // Handle mouse up event
  const onMouseUp = (event) => {
    if (event.button !== 0) return; // Only left mouse button
    
    try {
      if (isDragging && selectedObject) {
        // Apply a small random velocity when releasing
        selectedObject.userData.velocity.set(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        );
        
        // Reset dragging state
        isDragging = false;
        
        // Change cursor back based on whether we're still hovering
        renderer.domElement.style.cursor = intersectedObject ? 'grab' : 'default';
        
        // Re-enable orbit controls
        controls.enabled = true;
        
        // Reset mouse indicator
        if (mouseIndicator) {
          mouseIndicator.scale.set(1, 1, 1);
          mouseIndicator.children[0].material.color.set(
            intersectedObject ? 0xff00ff : 0x00ffff
          );
        }
      }
      
      selectedObject = null;
    } catch (error) {
      console.error('Error handling mouse up:', error);
    }
  };
  
  // Handle click event
  const onClick = (event) => {
    if (!intersectedObject || isDragging) return;
    
    try {
      // Give the clicked object a boost upward
      intersectedObject.userData.velocity.y += 0.5;
      
      // Add some random rotation
      intersectedObject.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.03,
        y: (Math.random() - 0.5) * 0.03,
        z: (Math.random() - 0.5) * 0.03
      };
    } catch (error) {
      console.error('Error handling click:', error);
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
  
  // Handle window resize
  const onWindowResize = () => {
    if (!renderer || !renderer.domElement || !renderer.domElement.parentElement) {
      return;
    }
    
    try {
      // Get container dimensions
      const container = renderer.domElement.parentElement;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      windowHalfX = containerWidth / 2;
      windowHalfY = containerHeight / 2;
      
      if (camera) {
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();
      }
      
      renderer.setSize(containerWidth, containerHeight);
    } catch (error) {
      console.error('Error handling window resize:', error);
    }
  };
  
  // Animation loop
  const animate = () => {
    if (!scene || !camera || !renderer || !clock || !controls) {
      return;
    }
    
    try {
      animationFrameId = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      
      // Update controls
      controls.update();
      
      // Update mouse indicator animation - safely
      try {
        if (mouseIndicator && mouseIndicator.children && mouseIndicator.children.length > 0) {
          // Subtle pulsing animation
          const pulse = 1 + Math.sin(elapsedTime * 5) * 0.05;
          if (mouseIndicator.children[0].scale && typeof mouseIndicator.children[0].scale.set === 'function') {
            mouseIndicator.children[0].scale.set(pulse, pulse, 1);
          }
          
          // Rotate the ring slightly
          if (mouseIndicator.children[0].rotation && typeof mouseIndicator.children[0].rotation.z === 'number') {
            mouseIndicator.children[0].rotation.z += delta * 0.5;
          }
        }
      } catch (err) {
        console.error('Error updating mouse indicator animation:', err);
      }
      
      // Skip collision checks for objects being dragged - safely
      try {
        if (!isDragging) {
          checkCollisions();
        }
      } catch (err) {
        console.error('Error during collision checks in animation loop:', err);
      }
      
      // Animate geometries with physics
      if (geometries && geometries.length > 0) {
        geometries.forEach((mesh) => {
          if (!mesh || !mesh.userData || !mesh.userData.velocity || !mesh.position) return;
          
          // Apply gravity and velocity - safely
          try {
            // Apply gravity
            if (mesh.userData.velocity && typeof mesh.userData.velocity.y === 'number') {
              mesh.userData.velocity.y -= 0.01; // Gravity effect
            }
            
            // Apply velocity to position
            if (mesh.position && mesh.userData.velocity) {
              if (typeof mesh.position.x === 'number' && typeof mesh.userData.velocity.x === 'number') {
                mesh.position.x += mesh.userData.velocity.x;
              }
              if (typeof mesh.position.y === 'number' && typeof mesh.userData.velocity.y === 'number') {
                mesh.position.y += mesh.userData.velocity.y;
              }
              if (typeof mesh.position.z === 'number' && typeof mesh.userData.velocity.z === 'number') {
                mesh.position.z += mesh.userData.velocity.z;
              }
            }
            
            // Apply damping (air resistance)
            if (mesh.userData.velocity && typeof mesh.userData.velocity.multiplyScalar === 'function') {
              mesh.userData.velocity.multiplyScalar(0.99);
            }
          } catch (err) {
            console.error('Error updating physics for mesh:', err);
          }
          
          // Rotate each geometry if rotationSpeed exists - safely
          try {
            if (mesh.rotation && mesh.userData.rotationSpeed) {
              if (typeof mesh.rotation.x === 'number' && typeof mesh.userData.rotationSpeed.x === 'number') {
                mesh.rotation.x += mesh.userData.rotationSpeed.x;
              }
              if (typeof mesh.rotation.y === 'number' && typeof mesh.userData.rotationSpeed.y === 'number') {
                mesh.rotation.y += mesh.userData.rotationSpeed.y;
              }
              if (typeof mesh.rotation.z === 'number' && typeof mesh.userData.rotationSpeed.z === 'number') {
                mesh.rotation.z += mesh.userData.rotationSpeed.z;
              }
            }
          } catch (err) {
            console.error('Error updating rotation for mesh:', err);
          }
          
          // Float effect (reduced since we have physics now) - safely
          try {
            if (mesh.position && 
                typeof mesh.position.y === 'number' &&
                typeof mesh.userData.floatSpeed === 'number' && 
                typeof mesh.userData.floatHeight === 'number') {
              const floatEffect = Math.sin(elapsedTime * mesh.userData.floatSpeed) * 
                               (mesh.userData.floatHeight * 0.3);
              mesh.position.y += floatEffect * delta * 10; // Apply as delta-based adjustment
            }
          } catch (err) {
            console.error('Error applying float effect for mesh:', err);
          }
          
          // Boundary checks - bounce off invisible walls
          if (mesh.position) {
            const bounceRestitution = 0.7; // How bouncy the walls are
            
            // X boundaries (left/right walls) - safely
            try {
              if (mesh.position && typeof mesh.position.x === 'number' && 
                  mesh.userData.velocity && typeof mesh.userData.velocity.x === 'number') {
                if (Math.abs(mesh.position.x) > 120) {
                  mesh.position.x = Math.sign(mesh.position.x) * 120;
                  mesh.userData.velocity.x *= -bounceRestitution;
                }
              }
            } catch (err) {
              console.error('Error handling X boundaries for mesh:', err);
            }
            
            // Z boundaries (front/back walls) - safely
            try {
              if (mesh.position && typeof mesh.position.z === 'number' && 
                  mesh.userData.velocity && typeof mesh.userData.velocity.z === 'number') {
                if (Math.abs(mesh.position.z) > 120) {
                  mesh.position.z = Math.sign(mesh.position.z) * 120;
                  mesh.userData.velocity.z *= -bounceRestitution;
                }
              }
            } catch (err) {
              console.error('Error handling Z boundaries for mesh:', err);
            }
            
            // Y boundaries (floor and ceiling) - safely
            try {
              if (mesh.position && typeof mesh.position.y === 'number') {
                if (mesh.position.y < 2) { // Floor collision
                  mesh.position.y = 2;
                  if (mesh.userData.velocity && typeof mesh.userData.velocity.y === 'number') {
                    mesh.userData.velocity.y *= -bounceRestitution;
                    
                    // Add some friction when hitting the floor
                    if (typeof mesh.userData.velocity.x === 'number') {
                      mesh.userData.velocity.x *= 0.95;
                    }
                    if (typeof mesh.userData.velocity.z === 'number') {
                      mesh.userData.velocity.z *= 0.95;
                    }
                  }
                } else if (mesh.position.y > 100) { // Ceiling collision
                  mesh.position.y = 100;
                  if (mesh.userData.velocity && typeof mesh.userData.velocity.y === 'number') {
                    mesh.userData.velocity.y *= -bounceRestitution;
                  }
                } else if (mesh.position.y < -20) { // If object falls too far below, reset it
                  // Reset position to a random height
                  if (typeof mesh.position.set === 'function') {
                    mesh.position.set(
                      (Math.random() - 0.5) * 10,  // x
                      10 + Math.random() * 5,     // y - start above the scene
                      (Math.random() - 0.5) * 10   // z
                    );
                  }
                  
                  // Reset velocity
                  if (mesh.userData.velocity && typeof mesh.userData.velocity.set === 'function') {
                    mesh.userData.velocity.set(0, 0, 0);
                  }
                }
              }
            } catch (err) {
              console.error('Error handling Y boundaries for mesh:', err);
            }
            
            // Visual effect for floor collision - safely
            try {
              if (mesh.position && typeof mesh.position.y === 'number' && 
                  mesh.userData.velocity && typeof mesh.userData.velocity.y === 'number' &&
                  mesh.position.y <= 2.1 && Math.abs(mesh.userData.velocity.y) < 0.02) {
                // Object is resting on the floor
                if (mesh.material && mesh.material.emissive && 
                    typeof mesh.material.emissive.copy === 'function' && 
                    !mesh.userData.colliding) {
                  // Subtle glow effect for resting objects
                  const restingGlow = new THREE.Color(0x111111);
                  mesh.material.emissive.copy(restingGlow);
                  mesh.material.needsUpdate = true;
                }
              }
            } catch (err) {
              console.error('Error applying floor resting effect for mesh:', err);
            }
          }
        });
      }
      
      // Render scene
      renderer.render(scene, camera);
    } catch (error) {
      console.error('Error in animation loop:', error);
      cancelAnimationFrame(animationFrameId);
    }
  };
  
  // Create camera intro animation
  const startCameraIntroAnimation = () => {
    if (!camera) return;
    
    try {
      // Temporarily disable orbit controls during the intro animation
      if (controls) {
        controls.enabled = false;
      }
      
      // Define the target position (final camera position)
      const targetPosition = { x: 0, y: 30, z: 70 };
      
      // Create a timeline for the camera animation
      const timeline = gsap.timeline({
        onComplete: () => {
          // Re-enable orbit controls after animation completes
          if (controls) {
            controls.enabled = true;
          }
        }
      });
      
      // First movement: Swoop in from a distance
      timeline.to(camera.position, {
        x: 50,
        y: 50,
        z: 100,
        duration: 2.5,
        ease: "power2.inOut",
      });
      
      // Second movement: Circle around to view from another angle
      timeline.to(camera.position, {
        x: -40,
        y: 40,
        z: 80,
        duration: 2,
        ease: "power1.inOut",
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
        }
      });
      
      // Final movement: Settle into the final position
      timeline.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
        }
      });
    } catch (error) {
      console.error('Error in camera intro animation:', error);
      // Ensure camera is at the correct position even if animation fails
      if (camera) {
        camera.position.set(0, 30, 70);
        camera.lookAt(0, 0, 0);
      }
      // Re-enable controls
      if (controls) {
        controls.enabled = true;
      }
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
      
      // Dispose of Three.js resources
      if (plane && plane.geometry) {
        plane.geometry.dispose();
        if (plane.material) {
          if (Array.isArray(plane.material)) {
            plane.material.forEach(material => material.dispose());
          } else {
            plane.material.dispose();
          }
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
    cleanup
  };
}