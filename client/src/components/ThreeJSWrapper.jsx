import React, { Suspense, useState, useEffect } from 'react';

// Dynamic Three.js loader with error isolation
const loadThreeJS = async () => {
  try {
    const [fiberModule, dreiModule] = await Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei')
    ]);
    
    return {
      Canvas: fiberModule.Canvas,
      OrbitControls: dreiModule.OrbitControls,
      loaded: true
    };
  } catch (error) {
    console.warn('Three.js modules failed to load:', error);
    return { loaded: false, error: error.message };
  }
};

// Isolated Three.js Components
const BaseSheet = ({ dimensions, selectedWoodType, woodTypes }) => {
  const wood = woodTypes[selectedWoodType] || woodTypes.maple;
  const baseColor = [wood.baseColor.r, wood.baseColor.g, wood.baseColor.b];
  const baseThickness = 0.25;

  return (
    <mesh position={[0, -baseThickness / 2, 0]}>
      <boxGeometry args={[dimensions.width, baseThickness, dimensions.depth]} />
      <meshStandardMaterial color={baseColor} roughness={0.8} metalness={0.1} />
    </mesh>
  );
};

const DividerWall = ({ position, dimensions, selectedWoodType, woodTypes }) => {
  const wood = woodTypes[selectedWoodType] || woodTypes.maple;
  const dividerColor = [wood.dividerColor.r, wood.dividerColor.g, wood.dividerColor.b];

  return (
    <mesh position={position}>
      <boxGeometry args={dimensions} />
      <meshStandardMaterial color={dividerColor} roughness={0.8} metalness={0.1} />
    </mesh>
  );
};

const DrawerScene = ({ selectedWoodType, dimensions, blocks, splitLines, woodTypes }) => {
  const dividerThickness = 0.5;

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.6}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.4} />
      
      <BaseSheet dimensions={dimensions} selectedWoodType={selectedWoodType} woodTypes={woodTypes} />
      
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
      <div className="w-full h-full min-h-[300px] max-h-[60vh] flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-slate-300">
        <div className="flex justify-between items-center p-3 bg-white border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">3D Preview</h3>
          <div className="text-xs text-blue-600">Loading Three.js...</div>
        </div>
        <LoadingFallback />
      </div>
    );
  }

  if (error || !threeJS) {
    return (
      <div className="w-full h-full min-h-[300px] max-h-[60vh] flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-slate-300">
        <div className="flex justify-between items-center p-3 bg-white border-b border-slate-200">
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
    <div className="w-full h-full min-h-[300px] max-h-[60vh] flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-slate-300">
      <div className="flex justify-between items-center p-3 bg-white border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">3D Preview</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span>🖱️ Drag to rotate</span>
          <span>•</span>
          <span>🔍 Scroll to zoom</span>
          <span>•</span>
          <span>Three.js v8</span>
        </div>
      </div>

      <div className="flex-1 relative cursor-grab active:cursor-grabbing">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ 
              position: [dimensions.width * 1.2, dimensions.height * 1.5, dimensions.depth * 1.2], 
              fov: 50 
            }}
            gl={{ 
              antialias: true, 
              alpha: false,
              preserveDrawingBuffer: true 
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#f8fafc', 1);
            }}
            className="w-full h-full"
          >
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={Math.max(dimensions.width, dimensions.depth) * 0.8}
              maxDistance={Math.max(dimensions.width, dimensions.depth) * 5}
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
            />
          </Canvas>
        </Suspense>
      </div>

      <div className="flex justify-between items-center p-3 bg-white border-t border-slate-200 text-xs">
        <div className="flex items-center space-x-3 text-gray-600">
          <span className="font-medium text-gray-800">{woodTypes[selectedWoodType]?.name || 'Maple'}</span>
          <span className="text-gray-400">•</span>
          <span>Base: 0.25" thick</span>
          <span className="text-gray-400">•</span>
          <span>Dividers: 0.5" thick × {dimensions.height}" tall</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-600">
          <span>Compartments: <span className="font-medium text-gray-800">{blocks ? blocks.length : 0}</span></span>
          <span>Dividers: <span className="font-medium text-gray-800">{splitLines ? splitLines.length : 0}</span></span>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="text-xs text-gray-500 text-center">
          Isolated Three.js v8 • Compatible with React 18 • No Shadows • Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
};

export default ThreeJSWrapper; 