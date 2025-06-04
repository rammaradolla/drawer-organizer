// WoodBox.jsx - React Three Fiber implementation for drawer organizer
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Individual wooden compartment component
// Get texture URL based on wood type (shared function)
const getTextureUrl = (woodType) => {
  const textureFiles = {
    birch: '/textures/birch.jpg',
    maple: '/textures/maple.jpg',
    pine: '/textures/maple.jpg',
    ash: '/textures/ash.jpg',
    oak: '/textures/oak-red.jpeg',
    cherry: '/textures/cherry.jpg',
    beech: '/textures/beech.jpg',
    walnut: '/textures/walnut.jpeg',
    mahogany: '/textures/cherry.jpg',
    ebony: '/textures/walnut.jpeg'
  };
  return textureFiles[woodType] || '/textures/maple.jpg';
};

function WoodenCompartment({ position, size, selectedWoodType, isEdgeGrain = false }) {

  const woodTexture = useTexture(getTextureUrl(selectedWoodType));

  // Configure texture wrapping and repeat
  React.useEffect(() => {
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    
    if (isEdgeGrain) {
      // Edge grain pattern - rotate and scale for edge visibility
      woodTexture.rotation = Math.PI / 2;
      woodTexture.repeat.set(1, 3);
    } else {
      // Face grain pattern
      woodTexture.repeat.set(2, 2);
    }
  }, [woodTexture, isEdgeGrain]);

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial 
        map={woodTexture} 
        roughness={0.7}
        metalness={0.0}
      />
    </mesh>
  );
}

// Main drawer organizer component
function DrawerOrganizer({ blocks, dimensions, selectedWoodType }) {
  const PIXELS_PER_INCH = 10;
  const scale = 0.3;
  const drawerWidth = dimensions.width * scale;
  const drawerDepth = dimensions.depth * scale;
  const drawerHeight = dimensions.height * scale;
  const bottomPlywoodThickness = 0.075;
  const dividerThickness = 0.15;

  // Create drawer base
  const BaseComponent = () => {
    const woodTexture = useTexture(getTextureUrl(selectedWoodType));
    
    React.useEffect(() => {
      woodTexture.wrapS = THREE.RepeatWrapping;
      woodTexture.wrapT = THREE.RepeatWrapping;
      woodTexture.repeat.set(2, 2);
    }, [woodTexture]);

    return (
      <mesh position={[0, -drawerHeight/2, 0]}>
        <boxGeometry args={[drawerWidth, bottomPlywoodThickness, drawerDepth]} />
        <meshStandardMaterial 
          map={woodTexture} 
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>
    );
  };

  // Create dividers based on blocks
  const DividerComponents = () => {
    const dividers = [];
    const processedDividers = new Set();

    blocks.forEach((block) => {
      const blockX = (block.x / PIXELS_PER_INCH) * scale - drawerWidth/2;
      const blockY = -drawerHeight/2 + bottomPlywoodThickness/2;
      const blockZ = (block.y / PIXELS_PER_INCH) * scale - drawerDepth/2;
      const blockWidth = (block.width / PIXELS_PER_INCH) * scale;
      const blockDepth = (block.height / PIXELS_PER_INCH) * scale;
      const dividerHeight = drawerHeight - bottomPlywoodThickness;

      // Vertical dividers (right edge)
      if (blockX + blockWidth < drawerWidth/2 - 0.05) {
        const dividerKey = `v_${(blockX + blockWidth).toFixed(2)}_${blockZ.toFixed(2)}_${blockDepth.toFixed(2)}`;
        if (!processedDividers.has(dividerKey)) {
          dividers.push(
            <WoodenCompartment
              key={dividerKey}
              position={[blockX + blockWidth, blockY + dividerHeight/2, blockZ + blockDepth/2]}
              size={[dividerThickness, dividerHeight, blockDepth]}
              selectedWoodType={selectedWoodType}
              isEdgeGrain={true}
            />
          );
          processedDividers.add(dividerKey);
        }
      }

      // Horizontal dividers (front edge)
      if (blockZ + blockDepth < drawerDepth/2 - 0.05) {
        const dividerKey = `h_${blockX.toFixed(2)}_${(blockZ + blockDepth).toFixed(2)}_${blockWidth.toFixed(2)}`;
        if (!processedDividers.has(dividerKey)) {
          dividers.push(
            <WoodenCompartment
              key={dividerKey}
              position={[blockX + blockWidth/2, blockY + dividerHeight/2, blockZ + blockDepth]}
              size={[blockWidth, dividerHeight, dividerThickness]}
              selectedWoodType={selectedWoodType}
              isEdgeGrain={true}
            />
          );
          processedDividers.add(dividerKey);
        }
      }
    });

    return <>{dividers}</>;
  };

  return (
    <>
      <BaseComponent />
      <DividerComponents />
    </>
  );
}

// Very simple test component without textures
function SimpleColorBox({ selectedWoodType }) {
  // Get a color based on wood type for testing
  const getWoodColor = (woodType) => {
    const colors = {
      birch: '#f5f1e8',
      maple: '#f2e6d0', 
      ash: '#e8dcc6',
      oak: '#d4a574',
      cherry: '#c65d00',
      beech: '#e0c097',
      walnut: '#8b4513',
      mahogany: '#c04000',
      ebony: '#3c2415'
    };
    return colors[woodType] || '#deb887';
  };

  return (
    <mesh>
      <boxGeometry args={[3, 1, 2]} />
      <meshStandardMaterial color={getWoodColor(selectedWoodType)} />
    </mesh>
  );
}

// Main 3D scene component  
export default function DrawerOrganizerScene({ blocks, selectedWoodType }) {
  console.log('DrawerOrganizerScene rendering with:', { blocks: blocks?.length, selectedWoodType });
  
  return (
    <div className="w-full h-full min-h-[300px] max-h-[60vh]">
      <Canvas 
        camera={{ position: [5, 3, 5] }}
        className="w-full h-full rounded-lg bg-gray-100"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        
        <SimpleColorBox selectedWoodType={selectedWoodType} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}