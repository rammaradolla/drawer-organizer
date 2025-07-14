import React, { Suspense, useState, useEffect, useRef } from 'react';

// Dynamic Three.js loader with error isolation
const loadThreeJS = async () => {
  try {
    const [fiberModule, dreiModule, threeModule] = await Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei'),
      import('three')
    ]);
    
    return {
      Canvas: fiberModule.Canvas,
      OrbitControls: dreiModule.OrbitControls,
      TextureLoader: threeModule.TextureLoader,
      RepeatWrapping: threeModule.RepeatWrapping,
      loaded: true
    };
  } catch (error) {
    console.warn('Three.js modules failed to load:', error);
    return { loaded: false, error: error.message };
  }
};

// Global texture cache to persist across refreshes
const textureCache = new Map();

// Direct texture management with Three.js refs - bypasses React rendering
const useDirectTexture = (selectedWoodType, woodTypes, TextureLoader, RepeatWrapping) => {
  const [textureStatus, setTextureStatus] = useState('loading');
  const baseTextureRef = useRef(null);
  const dividerTextureRef = useRef(null);
  const baseMaterialRef = useRef(null);
  const dividerMaterialRefs = useRef(new Set());

  useEffect(() => {
    if (!TextureLoader || !RepeatWrapping || !selectedWoodType || !woodTypes) return;

    const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];
    if (!selectedWood) return;

    const cacheKey = selectedWood.url;
    
    // Check cache first
    if (textureCache.has(cacheKey)) {
      console.log('🎯 USING CACHED TEXTURE:', selectedWood.name);
      const cachedTexture = textureCache.get(cacheKey);
      applyTextureDirectly(cachedTexture, selectedWood);
      return;
    }

    console.log('🚀 DIRECT TEXTURE LOADING:', selectedWood.name, selectedWood.url);
    setTextureStatus('loading');

    const loader = new TextureLoader();
    loader.load(
      selectedWood.url,
      (loadedTexture) => {
        console.log('✅ DIRECT TEXTURE LOADED:', selectedWood.name);
        
        // Cache the texture
        textureCache.set(cacheKey, loadedTexture);
        
        // Apply directly to materials
        applyTextureDirectly(loadedTexture, selectedWood);
      },
      undefined,
      (error) => {
        console.error('❌ DIRECT TEXTURE FAILED:', selectedWood.name, error);
        setTextureStatus('error');
      }
    );

    function applyTextureDirectly(texture, wood) {
      try {
        // Create base texture
        const baseTexture = texture.clone();
        baseTexture.wrapS = RepeatWrapping;
        baseTexture.wrapT = RepeatWrapping;
        baseTexture.repeat.set(3, 3);
        baseTexture.needsUpdate = true;
        
        // Create divider texture  
        const dividerTexture = texture.clone();
        dividerTexture.wrapS = RepeatWrapping;
        dividerTexture.wrapT = RepeatWrapping;
        dividerTexture.repeat.set(1, 2);
        dividerTexture.needsUpdate = true;

        // Store in refs
        baseTextureRef.current = baseTexture;
        dividerTextureRef.current = dividerTexture;

        // Apply directly to existing materials
        if (baseMaterialRef.current) {
          baseMaterialRef.current.map = baseTexture;
          baseMaterialRef.current.color.setHex(0xf5e6d3); // Natural wood color
          baseMaterialRef.current.emissive.setHex(0x332211); // Warm glow
          baseMaterialRef.current.emissiveIntensity = 0.1;
          baseMaterialRef.current.roughness = 0.4;
          baseMaterialRef.current.needsUpdate = true;
          console.log('🎯 BASE MATERIAL UPDATED - Natural Wood Color Applied');
        }

        // Apply to all divider materials
        dividerMaterialRefs.current.forEach(material => {
          if (material) {
            material.map = dividerTexture;
            material.color.setHex(0xc4966b); // Complementary dark wood tone
            material.emissive.setHex(0x221100); // Subtle dark glow
            material.emissiveIntensity = 0.05;
            material.roughness = 0.6;
            material.needsUpdate = true;
          }
        });
        
        console.log('🎯 ALL MATERIALS UPDATED DIRECTLY - TEXTURES APPLIED');
        setTextureStatus('loaded');
        
      } catch (error) {
        console.error('❌ DIRECT TEXTURE APPLICATION ERROR:', error);
        setTextureStatus('error');
      }
    }
  }, [selectedWoodType, TextureLoader, RepeatWrapping, woodTypes]);

  return {
    baseTexture: baseTextureRef.current,
    dividerTexture: dividerTextureRef.current,
    textureStatus,
    baseMaterialRef,
    dividerMaterialRefs
  };
};

// Enhanced BaseSheet with natural wood color matching user's sample
const BaseSheet = ({ dimensions, selectedWoodType, woodTypes, baseMaterialRef, baseTexture }) => {
  const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];
  const baseThickness = 0.25;
  
  // Natural wood color matching the user's sample - warm creamy beige
  const naturalWoodColor = 0xf5e6d3; // Warm, creamy beige like the sample image
  
  // Material properties optimized for natural wood appearance
  const materialProps = {
    map: baseTexture,
    color: baseTexture ? naturalWoodColor : [
      // Fallback colors that also match the natural wood tone
      0.96, // Warm light
      0.90, // Slight cream tint
      0.83  // Beige undertone
    ],
    roughness: 0.4, // Slightly more texture for realism
    metalness: 0.01, // Very minimal for natural wood
    emissive: 0x332211, // Subtle warm glow
    emissiveIntensity: 0.1, // Very gentle
    transparent: false,
    toneMapped: true
  };

  const handleMaterialRef = (material) => {
    if (material) {
      baseMaterialRef.current = material;
      // Apply the natural wood color immediately
      if (baseTexture) {
        material.color.setHex(naturalWoodColor);
        material.needsUpdate = true;
      }
      console.log('🏗️ BASE MATERIAL - Natural Wood Color Applied:', {
        color: naturalWoodColor.toString(16),
        hasTexture: !!baseTexture
      });
    }
  };

  console.log('🏗️ BaseSheet - NATURAL WOOD COLOR MODE:', {
    hasTexture: !!baseTexture,
    selectedWood: selectedWood?.name,
    naturalColor: '#f5e6d3 (warm creamy beige)',
    materialMode: baseTexture ? 'TEXTURE + NATURAL COLOR' : 'NATURAL FALLBACK COLORS'
  });

  return (
    <mesh position={[0, -baseThickness / 2, 0]} receiveShadow>
      <boxGeometry args={[dimensions.width, baseThickness, dimensions.depth]} />
      <meshStandardMaterial ref={handleMaterialRef} {...materialProps} />
    </mesh>
  );
};

// Enhanced DividerWall with very light cream wood tone matching user's latest sample
const DividerWall = ({ position, dimensions, selectedWoodType, woodTypes, dividerMaterialRefs, baseTexture }) => {
  const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];

  // Light warm wood color matching the user's attached sample
  const lightWarmWoodColor = 0xf0e6d8; // Light wood with warm creamy undertones
  
  // Material properties for dividers - light with warm tone
  const materialProps = {
    map: baseTexture,
    color: baseTexture ? lightWarmWoodColor : [
      // Fallback light warm colors
      0.94, // Light tone
      0.90, // Warm cream saturation
      0.85  // Warm beige undertone
    ],
    roughness: 0.42, // Smooth with slight texture
    metalness: 0.008, // Minimal metalness
    emissive: 0x554433, // Warm glow to enhance the warmth
    emissiveIntensity: 0.015, // Subtle warm glow
    transparent: false,
    toneMapped: true
  };

  const handleMaterialRef = (material) => {
    if (material) {
      dividerMaterialRefs.current.add(material);
      // Apply the light warm wood color immediately
      if (baseTexture) {
        material.color.setHex(lightWarmWoodColor);
        material.needsUpdate = true;
      }
      console.log('🧱 DIVIDER MATERIAL - Light Warm Wood Applied:', {
        color: lightWarmWoodColor.toString(16),
        hasTexture: !!baseTexture
      });
    }
  };

  return (
    <mesh position={position} castShadow>
      <boxGeometry args={dimensions} />
      <meshStandardMaterial ref={handleMaterialRef} {...materialProps} />
    </mesh>
  );
};

const DrawerScene = ({ selectedWoodType, dimensions, blocks, splitLines, woodTypes, TextureLoader, RepeatWrapping }) => {
  const dividerThickness = 0.5;
  
  const { baseTexture, dividerTexture, textureStatus, baseMaterialRef, dividerMaterialRefs } = useDirectTexture(
    selectedWoodType, 
    woodTypes, 
    TextureLoader, 
    RepeatWrapping
  );

  console.log('🎬 DIRECT TEXTURE SCENE:', {
    baseTexture: !!baseTexture ? '✅ Wood Grain Active' : '⏳ Loading/Fallback',
    dividerTexture: !!dividerTexture ? '✅ Wood Grain Active' : '⏳ Loading/Fallback',
    selectedWood: selectedWoodType,
    textureStatus,
    mode: 'DIRECT MATERIAL UPDATES - Bypass React rendering'
  });

  return (
    <>
      {/* Optimized lighting for wood grain texture visibility */}
      <ambientLight intensity={0.7} color="#fff8f0" />
      
      <directionalLight 
        position={[12, 12, 8]} 
        intensity={0.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-dimensions.width}
        shadow-camera-right={dimensions.width}
        shadow-camera-top={dimensions.depth}
        shadow-camera-bottom={-dimensions.depth}
        shadow-bias={-0.0001}
      />
      
      <directionalLight 
        position={[-8, 8, 6]} 
        intensity={0.3}
        color="#fff5e8"
      />
      
      <pointLight position={[-10, -6, -4]} intensity={0.3} color="#fff0e6" />
      <pointLight position={[10, -4, 10]} intensity={0.25} color="#ffffff" />
      <pointLight position={[0, -8, 0]} intensity={0.4} color="#fff8f0" decay={0.5} />
      <pointLight position={[0, 6, -8]} intensity={0.2} color="#f8f4e8" />
      
      <BaseSheet 
        dimensions={dimensions} 
        selectedWoodType={selectedWoodType} 
        woodTypes={woodTypes} 
        baseMaterialRef={baseMaterialRef}
        baseTexture={baseTexture}
      />
      
      {splitLines && splitLines.map((splitLine, index) => {
        const x1 = splitLine.x1 / 10;
        const y1 = splitLine.y1 / 10;
        const x2 = splitLine.x2 / 10;
        const y2 = splitLine.y2 / 10;
        
        const centerX = dimensions.width / 2;
        const centerZ = dimensions.depth / 2;
        
        if (splitLine.isHorizontal) {
          const wallWidth = Math.abs(x2 - x1);
          const wallX = (x1 + x2) / 2 - centerX;
          const wallZ = y1 - centerZ;
          
          return (
            <DividerWall
              key={`h-divider-${index}`}
              position={[wallX, dimensions.height / 2, wallZ]}
              dimensions={[wallWidth, dimensions.height, dividerThickness]}
              selectedWoodType={selectedWoodType}
              woodTypes={woodTypes}
              dividerMaterialRefs={dividerMaterialRefs}
              baseTexture={baseTexture}
            />
          );
        } else {
          const wallLength = Math.abs(y2 - y1);
          const wallX = x1 - centerX;
          const wallZ = (y1 + y2) / 2 - centerZ;
          
          return (
            <DividerWall
              key={`v-divider-${index}`}
              position={[wallX, dimensions.height / 2, wallZ]}
              dimensions={[dividerThickness, dimensions.height, wallLength]}
              selectedWoodType={selectedWoodType}
              woodTypes={woodTypes}
              dividerMaterialRefs={dividerMaterialRefs}
              baseTexture={baseTexture}
            />
          );
        }
      })}
    </>
  );
};

// Loading fallback
const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-gray-600">Loading 3D preview...</div>
    </div>
  </div>
);

// Enhanced texture loading overlay
const TextureLoadingOverlay = ({ selectedWoodType, woodTypes }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];

  useEffect(() => {
    setIsVisible(true);
    setProgress(0);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // Longer to show enhanced processing

    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 100));
    }, 300);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [selectedWoodType]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-2 right-2 bg-black bg-opacity-80 text-white px-4 py-3 rounded-lg text-xs shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <div className="flex flex-col space-y-1">
          <span className="font-medium">Processing {selectedWood?.name} texture... {progress}%</span>
          <span className="text-green-300">✨ Enhanced Natural Wood System</span>
          <span className="text-gray-300 text-xs">
            🌟 Light Base + Dark Dividers + Premium Lighting
          </span>
        </div>
      </div>
    </div>
  );
};

const CameraPositionDisplay = ({ camera }) => {
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });

  // Use a ref to avoid unnecessary renders
  const frameRef = useRef();

  useEffect(() => {
    if (!camera) return;
    let mounted = true;
    function update() {
      if (!mounted) return;
      setPos({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      });
      frameRef.current = requestAnimationFrame(update);
    }
    update();
    return () => {
      mounted = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [camera]);

  return (
    <div className="mt-2 text-xs text-gray-700 bg-gray-100 rounded px-3 py-2 inline-block shadow border border-gray-200">
      <span className="font-semibold">Camera Position:</span>{' '}
      X: {pos.x.toFixed(2)}&nbsp; Y: {pos.y.toFixed(2)}&nbsp; Z: {pos.z.toFixed(2)}
    </div>
  );
};

// Add or import the formatInches32 function from DrawerSetup
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function formatInches32(value) {
  const inches = Math.floor(value);
  let fraction = Math.round((value - inches) * 32);
  if (fraction === 0) return `${inches}"`;
  // Reduce fraction
  const divisor = gcd(fraction, 32);
  const num = fraction / divisor;
  const denom = 32 / divisor;
  return `${inches} ${num}/${denom}\"`;
}

// Main wrapper component
const ThreeJSWrapper = ({ selectedWoodType, dimensions, blocks, splitLines, woodTypes, threeRenderer }) => {
  const [threeJS, setThreeJS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [camera, setCamera] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const initThreeJS = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add delay to avoid initialization conflicts
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const threeJSModules = await loadThreeJS();
        
        if (mounted) {
          if (threeJSModules.loaded) {
            setThreeJS(threeJSModules);
          } else {
            setError(threeJSModules.error || 'Failed to load Three.js');
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initThreeJS();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-slate-300" style={{ minHeight: '300px', maxHeight: '60vh' }}>
        <div className="flex justify-between items-center p-2 bg-white border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">3D Preview</h3>
          <div className="text-xs text-blue-600">Loading Three.js...</div>
        </div>
        <LoadingFallback />
      </div>
    );
  }

  if (error || !threeJS) {
    return (
      <div className="w-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-slate-300" style={{ minHeight: '300px', maxHeight: '60vh' }}>
        <div className="flex justify-between items-center p-2 bg-white border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">3D Preview</h3>
          <div className="text-xs text-red-600">Error Mode</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <div className="text-4xl mb-4">🛡️</div>
            <div className="font-medium mb-2">Three.js Compatibility Issue</div>
            <div className="text-sm mb-4">{error || 'Failed to load 3D preview'}</div>
            <div className="text-xs text-slate-500">Using 2D view instead</div>
          </div>
        </div>
      </div>
    );
  }

  const { Canvas, OrbitControls } = threeJS;

  return (
    <div className="w-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-slate-300" style={{ minHeight: '300px', maxHeight: '60vh' }}>
      <div className="flex justify-between items-center p-2 bg-white border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">3D Preview</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span>🖱️ Drag to rotate</span>
          <span>•</span>
          <span>🔍 Scroll to zoom</span>
          <span>•</span>
          <span>Three.js v8 + Textures</span>
        </div>
      </div>

      <div className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ 
              position: [16.19, 15.35, -15.93],
              fov: 75 
            }}
            shadows={{
              enabled: true,
              type: 'pcf',
              size: 1024
            }}
            gl={{ 
              antialias: true, 
              alpha: false,
              preserveDrawingBuffer: true 
            }}
            onCreated={({ gl, camera, scene }) => {
              gl.setClearColor('#f8fafc', 1);
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = gl.PCFSoftShadowMap;
              if (threeRenderer) {
                threeRenderer.current = gl;
                threeRenderer.current.camera = camera;
                threeRenderer.current.scene = scene;
              }
              setCamera(camera);
            }}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          >
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={Math.max(dimensions.width, dimensions.depth) * 0.2}
              maxDistance={Math.max(dimensions.width, dimensions.depth) * 8}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={false}
              dampingFactor={0.05}
              enableDamping={true}
            />
            
            <DrawerScene
              selectedWoodType={selectedWoodType}
              dimensions={dimensions}
              blocks={blocks}
              splitLines={splitLines}
              woodTypes={woodTypes}
              TextureLoader={threeJS.TextureLoader}
              RepeatWrapping={threeJS.RepeatWrapping}
            />
          </Canvas>
        </Suspense>
        
        <TextureLoadingOverlay selectedWoodType={selectedWoodType} woodTypes={woodTypes} />
      </div>
      {/* Camera position display */}
      <div className="flex justify-center items-center mt-2">
        <CameraPositionDisplay camera={camera} />
      </div>
    </div>
  );
};

export default ThreeJSWrapper; 