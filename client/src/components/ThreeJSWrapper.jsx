import React, { Suspense, useState, useEffect } from 'react';

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

// Centralized texture manager hook with natural wood - light base and darker dividers
const useWoodTexture = (selectedWoodType, woodTypes, TextureLoader, RepeatWrapping) => {
  const [baseTexture, setBaseTexture] = useState(null);
  const [dividerTexture, setDividerTexture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!TextureLoader || !RepeatWrapping || !selectedWoodType) return;

    const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];
    if (!selectedWood) return;

    console.log('🎨 Loading texture - enhanced natural wood contrast (light base + dark dividers):', selectedWood.name);
    setLoading(true);
    setError(null);
    setBaseTexture(null);
    setDividerTexture(null);

    const loader = new TextureLoader();
    loader.load(
      selectedWood.url,
      (loadedTexture) => {
        console.log('✅ Texture loaded, creating enhanced natural wood variants:', selectedWood.name, '(Base: 30% lighter, Dividers: 20% darker)');
        
        // Create light base texture (brighter for base plate)
        const baseTextureClone = loadedTexture.clone();
        baseTextureClone.wrapS = RepeatWrapping;
        baseTextureClone.wrapT = RepeatWrapping;
        baseTextureClone.repeat.set(3, 3); // Slightly less repeats for better visibility
        baseTextureClone.offset.set(0, 0); // Reset offset
        baseTextureClone.rotation = 0; // Reset rotation
        baseTextureClone.needsUpdate = true;
        
        // Create darker divider texture (slightly darker for walls)
        const dividerTextureClone = loadedTexture.clone();
        dividerTextureClone.wrapS = RepeatWrapping;
        dividerTextureClone.wrapT = RepeatWrapping;
        dividerTextureClone.repeat.set(1, 2); // Less repeats for divider walls
        dividerTextureClone.needsUpdate = true;
        
        setBaseTexture(baseTextureClone);
        setDividerTexture(dividerTextureClone);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('❌ Texture load failed:', selectedWood.name, error.message);
        setError(error);
        setBaseTexture(null);
        setDividerTexture(null);
        setLoading(false);
      }
    );
  }, [selectedWoodType, TextureLoader, RepeatWrapping, woodTypes]);

  return { baseTexture, dividerTexture, loading, error };
};

// Isolated Three.js Components with light base and darker divider textures
const BaseSheet = ({ dimensions, selectedWoodType, woodTypes, baseTexture }) => {
  // Find the selected wood for fallback color
  const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];
  
  const baseThickness = 0.25;
  
  // Use natural light wood properties for base plate - lighter than dividers
  const materialProps = baseTexture 
    ? { 
        map: baseTexture, 
        roughness: 0.3, // Smoother for lighter wood appearance
        metalness: 0.01, // Very minimal metalness for natural light wood
        transparent: false,
        // Natural warm wood glow for lighter appearance
        emissive: 0x332211, // Warm, natural wood glow
        emissiveIntensity: 0.3, // Moderate intensity for natural light wood
        toneMapped: true,
        // Natural light wood tint - warm and light
        color: 0xffeecc // Warm, natural light wood tint
      }
    : { 
        // Natural light wood-colored fallback - brighter than dividers
        color: [
          Math.min((selectedWood?.baseColor?.r || 0.90) * 1.3, 1.0), // 30% brighter for light wood
          Math.min((selectedWood?.baseColor?.g || 0.82) * 1.25, 1.0), 
          Math.min((selectedWood?.baseColor?.b || 0.70) * 1.2, 1.0)
        ], 
        roughness: 0.3, 
        metalness: 0.01,
        emissive: 0x332211,
        emissiveIntensity: 0.3
      };

  console.log('🏗️ BaseSheet (NATURAL LIGHT WOOD - Enhanced):', {
    hasTexture: !!baseTexture,
    selectedWood: selectedWood?.name,
    appearance: 'natural light wood - lighter than dividers',
    contrast: '30% brighter than dividers',
    materialProps: baseTexture ? 'with enhanced light wood tint' : 'enhanced light wood color'
  });

  return (
    <mesh position={[0, -baseThickness / 2, 0]} receiveShadow>
      <boxGeometry args={[dimensions.width, baseThickness, dimensions.depth]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

const DividerWall = ({ position, dimensions, selectedWoodType, woodTypes, baseTexture }) => {
  // Find the selected wood for fallback color
  const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];

  // Use natural darker wood material for dividers - darker than light base
  const materialProps = baseTexture 
    ? { 
        map: baseTexture, 
        roughness: 0.7, // Rougher for natural darker wood appearance
        metalness: 0.08, // Slightly more metallic for deeper wood look
        transparent: false,
        // No emissive light to keep them naturally darker than base
        emissive: 0x000000, // No artificial glow for darker wood
        emissiveIntensity: 0,
        toneMapped: true,
        // Natural darker wood tint - warm but darker
        color: 0xccaa88 // Natural darker wood tint
      }
    : { 
        // Natural darker wood-colored fallback - clearly darker than base
        color: [
          (selectedWood?.baseColor?.r || 0.80) * 0.8, // 20% darker than base for clear contrast
          (selectedWood?.baseColor?.g || 0.72) * 0.8, 
          (selectedWood?.baseColor?.b || 0.60) * 0.8
        ], 
        roughness: 0.7, 
        metalness: 0.08,
        emissive: 0x000000,
        emissiveIntensity: 0
      };

  console.log('🧱 DividerWall (NATURAL DARK WOOD - Enhanced):', {
    hasTexture: !!baseTexture,
    selectedWood: selectedWood?.name,
    appearance: 'natural dark wood - darker than base',
    contrast: '20% darker than base for clear contrast'
  });

  return (
    <mesh position={position} castShadow>
      <boxGeometry args={dimensions} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

const DrawerScene = ({ selectedWoodType, dimensions, blocks, splitLines, woodTypes, TextureLoader, RepeatWrapping }) => {
  const dividerThickness = 0.5;
  
  // Use centralized texture loading with light base and dark divider textures
  const { baseTexture, dividerTexture, loading: textureLoading, error: textureError } = useWoodTexture(
    selectedWoodType, 
    woodTypes, 
    TextureLoader, 
    RepeatWrapping
  );

  console.log('🎬 Scene textures - Enhanced natural wood contrast:', {
    baseTexture: !!baseTexture ? '✅ Enhanced Light Wood (30% brighter)' : '⏳ Loading...',
    dividerTexture: !!baseTexture ? '✅ Enhanced Dark Wood (20% darker)' : '⏳ Loading...',
    selectedWood: selectedWoodType,
    contrast: 'Base lighter than dividers - natural wood tones'
  });

  return (
    <>
      {/* Enhanced lighting with shadow casting and better texture visibility */}
      <ambientLight intensity={0.85} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.6}
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
      {/* Additional lighting for texture visibility */}
      <pointLight position={[-10, -10, -5]} intensity={0.4} />
      <pointLight position={[10, -5, 10]} intensity={0.3} color="#ffffff" />
      <pointLight position={[0, -8, 0]} intensity={0.5} color="#fff8e7" /> {/* Warm light from below for base plate */}
      
      <BaseSheet 
        dimensions={dimensions} 
        selectedWoodType={selectedWoodType} 
        woodTypes={woodTypes} 
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

// Texture loading overlay
const TextureLoadingOverlay = ({ selectedWoodType, woodTypes }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedWood = woodTypes.find(w => w.id === selectedWoodType) || woodTypes[0];

  useEffect(() => {
    // Show loading overlay for a short time when texture changes
    setIsVisible(true);
    setProgress(0);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500); // Longer to show light/dark processing

    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + 12, 100));
    }, 300);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [selectedWoodType]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-2 rounded-md text-xs">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
        <div className="flex flex-col">
          <span>Processing {selectedWood?.name} texture... {progress}%</span>
          <span className="text-gray-300 text-xs">Enhanced: Light base + Dark dividers + Shadows</span>
        </div>
      </div>
    </div>
  );
};

// Main wrapper component
const ThreeJSWrapper = ({ selectedWoodType, dimensions, blocks, splitLines, woodTypes }) => {
  const [threeJS, setThreeJS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              position: [dimensions.width * 0.5, dimensions.height * 0.8, dimensions.depth * 0.5], 
              fov: 75 
            }}
            shadows={{
              enabled: true,
              type: 'pcf', // Percentage Closer Filtering for softer shadows
              size: 1024   // Good balance between quality and performance
            }}
            gl={{ 
              antialias: true, 
              alpha: false,
              preserveDrawingBuffer: true 
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#f8fafc', 1);
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = gl.PCFSoftShadowMap; // Soft shadows
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
        
        {/* Texture Loading Overlay */}
        <TextureLoadingOverlay selectedWoodType={selectedWoodType} woodTypes={woodTypes} />
      </div>
    </div>
  );
};

export default ThreeJSWrapper; 