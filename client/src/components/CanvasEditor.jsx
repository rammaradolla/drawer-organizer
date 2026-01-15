import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Line, Group, Text, Arrow } from 'react-konva';
import ThreeJSWrapper from './ThreeJSWrapper';
import AddToCartButton from './AddToCartButton';
import DrawerSetup from './DrawerSetup';

// Dynamic texture loading from public/textures directory
const loadAvailableTextures = () => {
  const textureFiles = [
    'ash.jpg',
    'beech.jpg', 
    'birch.jpg',
    'cherry.jpg',
    'maple.jpg',
    'oak-red.jpeg',
    'walnut.jpeg'
  ];

  return textureFiles.map(filename => {
    const name = filename.replace(/\.(jpg|jpeg)$/i, '');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
    
    return {
      id: name.toLowerCase().replace('-', ''),
      name: displayName,
      filename: filename,
      url: `/textures/${filename}`,
      // Generate realistic colors based on wood type for fallback
      baseColor: getWoodColor(name),
      dividerColor: getWoodColor(name, true)
    };
  });
};

// Generate realistic wood colors for fallback
const getWoodColor = (woodName, isDivider = false) => {
  const colorMap = {
    'ash': isDivider ? { r: 0.90, g: 0.85, b: 0.75 } : { r: 0.93, g: 0.89, b: 0.80 },
    'beech': isDivider ? { r: 0.84, g: 0.72, b: 0.55 } : { r: 0.88, g: 0.78, b: 0.62 },
    'birch': isDivider ? { r: 0.95, g: 0.90, b: 0.80 } : { r: 0.98, g: 0.94, b: 0.85 },
    'cherry': isDivider ? { r: 0.78, g: 0.55, b: 0.40 } : { r: 0.82, g: 0.60, b: 0.45 },
    'maple': isDivider ? { r: 0.94, g: 0.88, b: 0.72 } : { r: 0.96, g: 0.91, b: 0.75 },
    'oakred': isDivider ? { r: 0.80, g: 0.68, b: 0.48 } : { r: 0.85, g: 0.75, b: 0.55 },
    'walnut': isDivider ? { r: 0.60, g: 0.45, b: 0.30 } : { r: 0.65, g: 0.50, b: 0.35 }
  };
  
  return colorMap[woodName.toLowerCase().replace('-', '')] || 
         (isDivider ? { r: 0.94, g: 0.88, b: 0.72 } : { r: 0.96, g: 0.91, b: 0.75 });
};

// Load available textures
const availableTextures = loadAvailableTextures();

// Debug: Log available textures
console.log('Available textures loaded:', availableTextures);
console.log('Number of textures:', availableTextures.length);

// Three.js components moved to isolated ThreeJSWrapper.jsx to prevent reconciler conflicts

// Set grid size to 1/32 inch in pixels
const PIXELS_PER_INCH = 10; // Each inch is 10 pixels
const GRID_SIZE = (1 / 32) * PIXELS_PER_INCH; // Grid size is 1/32 inch
const PADDING = 40; // Padding around the canvas
const MIN_SIZE = 0.5 * PIXELS_PER_INCH; // Minimum size is 0.5 inches
const DIVIDER_THICKNESS_INCHES = 0.5;

const DimensionArrow = ({ start, end, label, offset = 20 }) => {
  const isHorizontal = start.y === end.y;
  const totalLength = isHorizontal ? Math.abs(end.x - start.x) : Math.abs(end.y - start.y);
  
  // Fixed gap for text (40 pixels)
  const textGap = 40;
  const arrowLength = Math.max(20, (totalLength - textGap) / 2);
  
  const lineY = isHorizontal ? start.y - offset : start.y;
  const lineX = isHorizontal ? start.x : start.x - offset;

  return (
    <Group>
      {/* Extension lines */}
      {isHorizontal ? (
        <>
          <Line
            points={[start.x, start.y, start.x, start.y - offset]}
            stroke="#666"
            strokeWidth={0.5}
          />
          <Line
            points={[end.x, end.y, end.x, end.y - offset]}
            stroke="#666"
            strokeWidth={0.5}
          />
        </>
      ) : (
        <>
          <Line
            points={[start.x, start.y, start.x - offset, start.y]}
            stroke="#666"
            strokeWidth={0.5}
          />
          <Line
            points={[end.x, end.y, end.x - offset, end.y]}
            stroke="#666"
            strokeWidth={0.5}
          />
        </>
      )}

      {isHorizontal ? (
        /* Horizontal dimension (width) */
        <>
          {/* Left arrow */}
          <Arrow
            points={[start.x, lineY, start.x + arrowLength, lineY]}
            pointerLength={8}
            pointerWidth={8}
            fill="#666"
            stroke="#666"
            strokeWidth={2}
            pointerAtBeginning={true}
            pointerAtEnding={false}
          />
          
          {/* Right arrow */}
          <Arrow
            points={[end.x - arrowLength, lineY, end.x, lineY]}
            pointerLength={8}
            pointerWidth={8}
            fill="#666"
            stroke="#666"
            strokeWidth={2}
            pointerAtBeginning={false}
            pointerAtEnding={true}
          />
          
          {/* Text centered exactly between arrow endpoints at arrow level */}
          <Text
            x={(start.x + arrowLength + end.x - arrowLength) / 2}
            y={lineY}
            text={label}
            fontSize={12}
            fill="#333"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            offsetY={0}
          />
        </>
      ) : (
        /* Vertical dimension (depth) */
        <>
          {/* Top arrow */}
          <Arrow
            points={[lineX, start.y, lineX, start.y + arrowLength]}
            pointerLength={8}
            pointerWidth={8}
            fill="#666"
            stroke="#666"
            strokeWidth={2}
            pointerAtBeginning={true}
            pointerAtEnding={false}
          />
          
          {/* Bottom arrow */}
          <Arrow
            points={[lineX, end.y - arrowLength, lineX, end.y]}
            pointerLength={8}
            pointerWidth={8}
            fill="#666"
            stroke="#666"
            strokeWidth={2}
            pointerAtBeginning={false}
            pointerAtEnding={true}
          />
          
          {/* Text centered exactly between arrow endpoints at arrow level */}
          <Text
            x={lineX}
            y={(start.y + arrowLength + end.y - arrowLength) / 2}
            text={label}
            fontSize={12}
            fill="#333"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            rotation={-90}
          />
        </>
      )}
    </Group>
  );
};

const CanvasEditor = forwardRef(({ onCompartmentsChange, onClear, addToCartButtonProps }, ref) => {
  const [dimensions, setDimensions] = useState({ width: 30, depth: 20, height: 2.5 });
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [scale, setScale] = useState(1);
  const [splitLines, setSplitLines] = useState([]);
  const [draggedLine, setDraggedLine] = useState(null);
  const [affectedBlocks, setAffectedBlocks] = useState([]);
  const [originalLinePosition, setOriginalLinePosition] = useState(null);
  const [selectedWoodType, setSelectedWoodType] = useState(availableTextures[0]?.id || 'maple'); // Use first available texture
  
  // History management
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const stageRef = useRef();
  const containerRef = useRef();
  const threeRenderer = useRef(); // Add this ref for 3D renderer
  const defaultDesignState = { blocks: [], splitLines: [] };

  // Add state for selected split line
  const [selectedSplitLineId, setSelectedSplitLineId] = useState(null);

  // Manufacturing tolerance: 1/16 inch (0.0625") reduction on width and depth
  const MANUFACTURING_TOLERANCE = 1/16; // 0.0625 inches
  const manufacturingDimensions = {
    width: Math.max(0, dimensions.width - MANUFACTURING_TOLERANCE),
    depth: Math.max(0, dimensions.depth - MANUFACTURING_TOLERANCE),
    height: dimensions.height // Height unchanged
  };

  // Convert manufacturing dimensions from inches to pixels for canvas
  const baseWidth = manufacturingDimensions.width * PIXELS_PER_INCH;
  const baseHeight = manufacturingDimensions.depth * PIXELS_PER_INCH;

  // Save current state to history
  const saveToHistory = (newBlocks, newSplitLines) => {
    const newState = {
      blocks: JSON.parse(JSON.stringify(newBlocks)),
      splitLines: JSON.parse(JSON.stringify(newSplitLines))
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setBlocks(previousState.blocks);
      setSplitLines(previousState.splitLines);
      setHistoryIndex(historyIndex - 1);
      setSelectedId(null);
      onCompartmentsChange && onCompartmentsChange(previousState.blocks);
    }
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setBlocks(nextState.blocks);
      setSplitLines(nextState.splitLines);
      setHistoryIndex(historyIndex + 1);
      setSelectedId(null);
      onCompartmentsChange && onCompartmentsChange(nextState.blocks);
    }
  };

  // Initialize the first block
  useEffect(() => {
    initializeCanvas();
  }, [baseWidth, baseHeight]);

  const initializeCanvas = () => {
    // Use manufacturing dimensions (with tolerance applied)
    const manufacturingWidth = Math.max(0, dimensions.width - MANUFACTURING_TOLERANCE);
    const manufacturingDepth = Math.max(0, dimensions.depth - MANUFACTURING_TOLERANCE);
    const baseWidth = manufacturingWidth * PIXELS_PER_INCH;
    const baseHeight = manufacturingDepth * PIXELS_PER_INCH;
    const initialBlocks = [{
      id: 'initial',
      x: 0,
      y: 0,
      width: baseWidth,
      height: baseHeight,
    }];
    setBlocks(initialBlocks);
    setSplitLines([]);
    setSelectedId(null);
    setDraggedLine(null);
    setAffectedBlocks([]);
    setOriginalLinePosition(null);
    setHistory([{
      blocks: JSON.parse(JSON.stringify(initialBlocks)),
      splitLines: []
    }]);
    setHistoryIndex(0);
  };

  // Set fixed scale for canvas
  useEffect(() => {
    setScale(1); // Always use 100% scale
  }, [dimensions.width, dimensions.depth]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Helper to check if a split line is only connected at the boundary
  function isSplitLineMovable(line, splitLines, dimensions) {
    if (line.isHorizontal) {
      // Row: check for vertical columns intersecting this row, not at left/right boundary
      return !splitLines.some(col => {
        if (col.isHorizontal) return false;
        // Check if vertical line crosses this row
        const x = col.x1;
        const y = line.y1;
        // Only block if intersection is not at left (0) or right (drawer width)
        if (Math.abs(y - col.y1) < 1e-2 || Math.abs(y - col.y2) < 1e-2) return false; // at top/bottom of column
                        if (Math.abs(x) < 1e-2 || Math.abs(x - manufacturingDimensions.width * PIXELS_PER_INCH) < 1e-2) return false; // at left/right boundary
        // Check if this row crosses the column
        return x > line.x1 + 1e-2 && x < line.x2 - 1e-2 && y > col.y1 + 1e-2 && y < col.y2 - 1e-2;
      });
    } else {
      // Column: check for horizontal rows intersecting this column, not at top/bottom boundary
      return !splitLines.some(row => {
        if (!row.isHorizontal) return false;
        const x = line.x1;
        const y = row.y1;
        // Only block if intersection is not at top (0) or bottom (drawer depth)
        if (Math.abs(x - row.x1) < 1e-2 || Math.abs(x - row.x2) < 1e-2) return false; // at left/right of row
                        if (Math.abs(y) < 1e-2 || Math.abs(y - manufacturingDimensions.depth * PIXELS_PER_INCH) < 1e-2) return false; // at top/bottom boundary
        // Check if this column crosses the row
        return y > line.y1 + 1e-2 && y < line.y2 - 1e-2 && x > row.x1 + 1e-2 && x < row.x2 - 1e-2;
      });
    }
  }

  // Keyboard arrow support for moving selected split line
  useEffect(() => {
    if (!selectedSplitLineId) return;
    const handleArrowKey = (e) => {
      const line = splitLines.find(l => l.id === selectedSplitLineId);
      if (!line) return;
      const isMovable = isSplitLineMovable(line, splitLines, dimensions);
      if (!isMovable) return;
      let moved = false;
      let newX = null, newY = null;
      if (!line.isHorizontal) {
        // Vertical column
        if (e.key === 'ArrowLeft') {
          newX = line.x1 - GRID_SIZE;
          moved = true;
        } else if (e.key === 'ArrowRight') {
          newX = line.x1 + GRID_SIZE;
          moved = true;
        }
      } else {
        // Horizontal row
        if (e.key === 'ArrowUp') {
          newY = line.y1 - GRID_SIZE;
          moved = true;
        } else if (e.key === 'ArrowDown') {
          newY = line.y1 + GRID_SIZE;
          moved = true;
        }
      }
      if (moved) {
        e.preventDefault();
        const origPos = { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 };
        updateBlocksAndLines(line, newX, newY, origPos);
      }
    };
    window.addEventListener('keydown', handleArrowKey);
    return () => window.removeEventListener('keydown', handleArrowKey);
  }, [selectedSplitLineId, splitLines, dimensions]);

  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const findAffectedBlocks = (splitLine) => {
    if (splitLine.isHorizontal) {
      // For horizontal lines, find blocks that are directly above or below this specific line segment
      return blocks.filter(block => {
        const lineY = splitLine.y1;
        const blockTouchesLine = (Math.abs(block.y + block.height - lineY) < 1 || Math.abs(block.y - lineY) < 1);
        const blockInLineSpan = (block.x < splitLine.x2) && (block.x + block.width > splitLine.x1);
        // Also check that the block overlaps with the line's X range significantly
        const significantOverlap = Math.min(block.x + block.width, splitLine.x2) - Math.max(block.x, splitLine.x1) > MIN_SIZE;
        return blockTouchesLine && blockInLineSpan && significantOverlap;
      });
    } else {
      // For vertical lines, find blocks that are directly left or right of this specific line segment
      return blocks.filter(block => {
        const lineX = splitLine.x1;
        const blockTouchesLine = (Math.abs(block.x + block.width - lineX) < 1 || Math.abs(block.x - lineX) < 1);
        const blockInLineSpan = (block.y < splitLine.y2) && (block.y + block.height > splitLine.y1);
        // Also check that the block overlaps with the line's Y range significantly
        const significantOverlap = Math.min(block.y + block.height, splitLine.y2) - Math.max(block.y, splitLine.y1) > MIN_SIZE;
        return blockTouchesLine && blockInLineSpan && significantOverlap;
      });
    }
  };

  const handleSplitLineDragStart = (e, splitLine) => {
    e.target.getStage().container().style.cursor = 'grabbing';
    setDraggedLine(splitLine);
    const affected = findAffectedBlocks(splitLine);
    setAffectedBlocks(affected);
    // Store the original position to restore if needed
    setOriginalLinePosition({
      x1: splitLine.x1,
      y1: splitLine.y1,
      x2: splitLine.x2,
      y2: splitLine.y2
    });
  };

  const handleSplitLineDragEnd = (e, splitLine) => {
    e.target.getStage().container().style.cursor = 'default';
    
    // Get the final drag position
    const draggedElement = e.target;
    const finalX = draggedElement.x();
    const finalY = draggedElement.y();
    
    // Apply the final snapped position
    if (splitLine.isHorizontal) {
      const snappedY = snapToGrid(finalY);
      const constrainedY = Math.max(MIN_SIZE, Math.min(baseHeight - MIN_SIZE, snappedY));
      updateBlocksAndLines(splitLine, null, constrainedY);
    } else {
      const snappedX = snapToGrid(finalX);
      const constrainedX = Math.max(MIN_SIZE, Math.min(baseWidth - MIN_SIZE, snappedX));
      updateBlocksAndLines(splitLine, constrainedX, null);
    }
    
    // Reset the dragged element position
    draggedElement.position({
      x: splitLine.isHorizontal ? splitLine.x1 : (splitLine.x1),
      y: splitLine.isHorizontal ? (splitLine.y1) : splitLine.y1
    });
    
    // Clear drag states
    setDraggedLine(null);
    setAffectedBlocks([]);
    setOriginalLinePosition(null);
  };

  // Update the function signature to accept originalLinePositionOverride
  const updateBlocksAndLines = (splitLine, newX, newY, originalLinePositionOverride = null) => {
    const origPos = originalLinePositionOverride || originalLinePosition;
    if (splitLine.isHorizontal && newY !== null) {
      // Find blocks that are specifically divided by this exact split line
      const affectedBlocks = findAffectedBlocks(splitLine);
      const blocksAbove = affectedBlocks.filter(b => Math.abs(b.y + b.height - origPos.y1) < 1);
      const blocksBelow = affectedBlocks.filter(b => Math.abs(b.y - origPos.y1) < 1);
      
      if (blocksAbove.length === 0 || blocksBelow.length === 0) return;

      const deltaY = newY - origPos.y1;
      
      // Check minimum sizes for affected blocks only
      const wouldBeTooSmallAbove = blocksAbove.some(b => (b.height + deltaY) < MIN_SIZE);
      const wouldBeTooSmallBelow = blocksBelow.some(b => (b.height - deltaY) < MIN_SIZE);
      
      if (wouldBeTooSmallAbove || wouldBeTooSmallBelow) return;

      const updatedBlocks = blocks.map(block => {
        if (blocksAbove.find(b => b.id === block.id)) {
          return { ...block, height: block.height + deltaY };
        }
        if (blocksBelow.find(b => b.id === block.id)) {
          return { 
            ...block, 
            y: block.y + deltaY,
            height: block.height - deltaY
          };
        }
        return block;
      });

      const updatedSplitLines = splitLines.map(sl => 
        sl.id === splitLine.id 
          ? { ...sl, y1: newY, y2: newY }
          : sl
      );

      setBlocks(updatedBlocks);
      setSplitLines(updatedSplitLines);
      saveToHistory(updatedBlocks, updatedSplitLines);
      onCompartmentsChange && onCompartmentsChange(updatedBlocks);

    } else if (!splitLine.isHorizontal && newX !== null) {
      // Find blocks that are specifically divided by this exact split line
      const affectedBlocks = findAffectedBlocks(splitLine);
      const blocksLeft = affectedBlocks.filter(b => Math.abs(b.x + b.width - origPos.x1) < 1);
      const blocksRight = affectedBlocks.filter(b => Math.abs(b.x - origPos.x1) < 1);
      
      if (blocksLeft.length === 0 || blocksRight.length === 0) return;

      const deltaX = newX - origPos.x1;
      
      // Check minimum sizes for affected blocks only
      const wouldBeTooSmallLeft = blocksLeft.some(b => (b.width + deltaX) < MIN_SIZE);
      const wouldBeTooSmallRight = blocksRight.some(b => (b.width - deltaX) < MIN_SIZE);
      
      if (wouldBeTooSmallLeft || wouldBeTooSmallRight) return;

      const updatedBlocks = blocks.map(block => {
        if (blocksLeft.find(b => b.id === block.id)) {
          return { ...block, width: block.width + deltaX };
        }
        if (blocksRight.find(b => b.id === block.id)) {
          return { 
            ...block, 
            x: block.x + deltaX,
            width: block.width - deltaX
          };
        }
        return block;
      });

      const updatedSplitLines = splitLines.map(sl => 
        sl.id === splitLine.id 
          ? { ...sl, x1: newX, x2: newX }
          : sl
      );

      setBlocks(updatedBlocks);
      setSplitLines(updatedSplitLines);
      saveToHistory(updatedBlocks, updatedSplitLines);
      onCompartmentsChange && onCompartmentsChange(updatedBlocks);
    }
  };

  const addRow = () => {
    if (!selectedId) return;

    const selectedBlock = blocks.find(b => b.id === selectedId);
    if (!selectedBlock) return;

    const splitY = selectedBlock.y + snapToGrid(selectedBlock.height / 2);
    
    const newBlocks = blocks.filter(b => b.id !== selectedId).concat([
      {
        id: `${selectedId}-top-${Date.now()}`,
        x: selectedBlock.x,
        y: selectedBlock.y,
        width: selectedBlock.width,
        height: splitY - selectedBlock.y,
      },
      {
        id: `${selectedId}-bottom-${Date.now()}`,
        x: selectedBlock.x,
        y: splitY,
        width: selectedBlock.width,
        height: selectedBlock.y + selectedBlock.height - splitY,
      }
    ]);

    const newSplitLine = {
      id: `split-${Date.now()}`,
      x1: selectedBlock.x,
      y1: splitY,
      x2: selectedBlock.x + selectedBlock.width,
      y2: splitY,
      isHorizontal: true,
    };

    const newSplitLines = [...splitLines, newSplitLine];

    setBlocks(newBlocks);
    setSplitLines(newSplitLines);
    saveToHistory(newBlocks, newSplitLines);
    setSelectedId(null);
    onCompartmentsChange && onCompartmentsChange(newBlocks);
  };

  const addColumn = () => {
    if (!selectedId) return;

    const selectedBlock = blocks.find(b => b.id === selectedId);
    if (!selectedBlock) return;

    const splitX = selectedBlock.x + snapToGrid(selectedBlock.width / 2);
    
    const newBlocks = blocks.filter(b => b.id !== selectedId).concat([
      {
        id: `${selectedId}-left-${Date.now()}`,
        x: selectedBlock.x,
        y: selectedBlock.y,
        width: splitX - selectedBlock.x,
        height: selectedBlock.height,
      },
      {
        id: `${selectedId}-right-${Date.now()}`,
        x: splitX,
        y: selectedBlock.y,
        width: selectedBlock.x + selectedBlock.width - splitX,
        height: selectedBlock.height,
      }
    ]);

    const newSplitLine = {
      id: `split-${Date.now()}`,
      x1: splitX,
      y1: selectedBlock.y,
      x2: splitX,
      y2: selectedBlock.y + selectedBlock.height,
      isHorizontal: false,
    };

    const newSplitLines = [...splitLines, newSplitLine];

    setBlocks(newBlocks);
    setSplitLines(newSplitLines);
    saveToHistory(newBlocks, newSplitLines);
    setSelectedId(null);
    onCompartmentsChange && onCompartmentsChange(newBlocks);
  };

  const handleClear = () => {
    console.log('[CanvasEditor] handleClear called');
    initializeCanvas();
    onCompartmentsChange && onCompartmentsChange([]);
    if (onClear) onClear();
  };

  // Convert pixels to inches for display
  const pixelsToInches = (pixels) => (pixels / PIXELS_PER_INCH).toFixed(2);

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

  useImperativeHandle(ref, () => ({
    initializeCanvas,
    handleClear
  }));

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col lg:flex-row gap-4 w-full h-full min-h-screen overflow-hidden bg-slate-50 p-2 sm:p-4" ref={containerRef}>
        {/* Left Section: Dimensions Form, Manufacturing Tolerance, and Add to Cart */}
        <div className="w-full lg:w-44 flex-shrink-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm overflow-y-auto">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Drawer Dimensions</h3>
          <DrawerSetup
            dimensions={dimensions}
            onDimensionsSet={setDimensions}
          />
        </div>

        {/* Middle Section: 2D and 3D Combined in Single Panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
              {/* 2D Design Section */}
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-1 flex-shrink-0">
                  <h3 className="text-base font-semibold text-slate-900">2D Design</h3>
                </div>
                
              {/* 2D Section Controls */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5 pb-1 border-b border-slate-200 overflow-x-auto flex-shrink-0" style={{ minHeight: '38px' }}>
                {/* Compartment Controls */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                    onClick={addRow}
                    disabled={!selectedId}
                  >
                    Add Row
                  </button>
                  <button
                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                    onClick={addColumn}
                    disabled={!selectedId}
                  >
                    Add Column
                  </button>
                  <button
                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-sm"
                    onClick={handleClear}
                  >
                    Clear All
                  </button>
                </div>

                {/* History Controls */}
                <div className="flex items-center space-x-1 border-l border-slate-300 pl-2 flex-shrink-0">
                  <button
                    className="px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    title="Undo (Ctrl+Z)"
                  >
                    ↶ Undo
                  </button>
                  <button
                    className="px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    title="Redo (Ctrl+Y)"
                  >
                    ↷ Redo
                  </button>
                </div>
              </div>
              
              <div className="relative flex-1 min-h-0">
                <div 
                  ref={containerRef} 
                  className="w-full overflow-hidden border-2 border-slate-300 cursor-grab active:cursor-grabbing flex items-center justify-center bg-slate-50" 
                  style={{ minHeight: '300px' }}
                >
                  <Stage
                    width={baseWidth * scale}
                    height={baseHeight * scale}
                    ref={stageRef}
                    scaleX={scale}
                    scaleY={scale}
                    onClick={(e) => {
                      if (e.target === e.target.getStage()) {
                        setSelectedId(null);
                      }
                    }}
                  >
                    <Layer>
                      {/* Draw grid */}
                      {Array.from({ length: baseWidth / GRID_SIZE + 1 }).map((_, i) => (
                        <Line
                          key={`v${i}`}
                          points={[i * GRID_SIZE, 0, i * GRID_SIZE, baseHeight]}
                          stroke={i % 4 === 0 ? "#e5e5e5" : "#f0f0f0"}
                          strokeWidth={i % 4 === 0 ? 0.3 : 0.1}
                        />
                      ))}
                      {Array.from({ length: baseHeight / GRID_SIZE + 1 }).map((_, i) => (
                        <Line
                          key={`h${i}`}
                          points={[0, i * GRID_SIZE, baseWidth, i * GRID_SIZE]}
                          stroke={i % 4 === 0 ? "#e5e5e5" : "#f0f0f0"}
                          strokeWidth={i % 4 === 0 ? 0.3 : 0.1}
                        />
                      ))}

                      {/* Draw boundary */}
                      <Rect
                        x={0}
                        y={0}
                        width={baseWidth}
                        height={baseHeight}
                        stroke="#333"
                        strokeWidth={2}
                        fill="transparent"
                      />
                      
                      {/* Clipping rectangle for all content inside the drawer */}
                      <Group clipFunc={(ctx) => {
                        ctx.beginPath();
                        ctx.rect(0, 0, baseWidth, baseHeight);
                        ctx.clip();
                      }}>
                        
                        {/* Draw blocks */}
                        {blocks.map((block) => {
                          const isAffected = affectedBlocks.find(b => b.id === block.id);
                          const isSelected = selectedId === block.id;
                          // Calculate internal (usable) width and depth
                          // Convert block position and size from pixels to inches
                          const blockLeft = block.x / PIXELS_PER_INCH;
                          const blockTop = block.y / PIXELS_PER_INCH;
                          const blockRight = (block.x + block.width) / PIXELS_PER_INCH;
                          const blockBottom = (block.y + block.height) / PIXELS_PER_INCH;
                          // Use manufacturing dimensions for boundary checks
                          const drawerRight = manufacturingDimensions.width;
                          const drawerBottom = manufacturingDimensions.depth;
                          // Subtract divider thickness if not at the edge
                          let internalWidth = block.width / PIXELS_PER_INCH;
                          let internalDepth = block.height / PIXELS_PER_INCH;
                          // Check for vertical dividers (left/right)
                          if (blockLeft > 0) internalWidth -= DIVIDER_THICKNESS_INCHES / 2;
                          if (blockRight < drawerRight) internalWidth -= DIVIDER_THICKNESS_INCHES / 2;
                          // Check for horizontal dividers (top/bottom)
                          if (blockTop > 0) internalDepth -= DIVIDER_THICKNESS_INCHES / 2;
                          if (blockBottom < drawerBottom) internalDepth -= DIVIDER_THICKNESS_INCHES / 2;
                          // Prevent negative or zero values
                          internalWidth = Math.max(0, internalWidth);
                          internalDepth = Math.max(0, internalDepth);
                          return (
                            <Group key={block.id}>
                              <Rect
                                x={block.x}
                                y={block.y}
                                width={block.width}
                                height={block.height}
                                onClick={() => setSelectedId(block.id)}
                                onTap={() => setSelectedId(block.id)}
                                fill={isSelected ? "#FFA500" : (isAffected ? "#7EB6E6" : "#9BC3E9")}
                                stroke={isSelected ? "#FF8C00" : "#64748B"}
                                strokeWidth={isSelected ? 3 : (isAffected ? 3 : 2)}
                              />
                              <Text
                                x={block.x + block.width / 2}
                                y={block.y + block.height / 2}
                                text={`W: ${formatInches32(internalWidth)}\nD: ${formatInches32(internalDepth)}`}
                                fontSize={8}
                                fill="#333"
                                align="center"
                                verticalAlign="middle"
                                width={block.width - 4}
                                height={block.height - 4}
                                offsetX={(block.width - 4) / 2}
                                offsetY={(block.height - 4) / 2}
                                listening={false}
                              />
                            </Group>
                          );
                        })}
                        
                        {/* Draw split lines */}
                        {splitLines.map((line) => {
                          const isDragging = draggedLine?.id === line.id;
                          const isSelectedSplitLine = selectedSplitLineId === line.id;
                          const isMovable = isSplitLineMovable(line, splitLines, dimensions);
                          return (
                            <Line
                              key={line.id}
                              x={line.isHorizontal ? line.x1 : line.x1}
                              y={line.isHorizontal ? line.y1 : line.y1}
                              points={line.isHorizontal ? [0, 0, line.x2 - line.x1, 0] : [0, 0, 0, line.y2 - line.y1]}
                              stroke={
                                isSelectedSplitLine
                                  ? (isMovable ? '#22c55e' : '#f59e42') // green if movable, orange if not
                                  : isDragging
                                  ? '#1E40AF'
                                  : '#2563EB'
                              }
                              strokeWidth={isDragging || isSelectedSplitLine ? 6 : 4}
                              draggable={isMovable}
                              perfectDrawEnabled={false}
                              onDragStart={isMovable ? (e) => handleSplitLineDragStart(e, line) : undefined}
                              onDragEnd={isMovable ? (e) => handleSplitLineDragEnd(e, line) : undefined}
                              onDblClick={() => setSelectedSplitLineId(isSelectedSplitLine ? null : line.id)}
                              onDblTap={() => setSelectedSplitLineId(isSelectedSplitLine ? null : line.id)}
                              dragBoundFunc={isMovable ? (pos) => {
                                const snappedX = snapToGrid(pos.x);
                                const snappedY = snapToGrid(pos.y);
                                
                                if (line.isHorizontal) {
                                  // Find the blocks that this specific line divides
                                  const affectedBlocks = findAffectedBlocks(line);
                                  const blocksAbove = affectedBlocks.filter(b => Math.abs(b.y + b.height - line.y1) < 1);
                                  const blocksBelow = affectedBlocks.filter(b => Math.abs(b.y - line.y1) < 1);
                                  
                                  // Get the vertical bounds from the affected blocks only
                                  let minY = line.y1;
                                  let maxY = line.y1;
                                  
                                  if (blocksAbove.length > 0 && blocksBelow.length > 0) {
                                    const topBounds = Math.max(...blocksAbove.map(b => b.y + MIN_SIZE));
                                    const bottomBounds = Math.min(...blocksBelow.map(b => b.y + b.height - MIN_SIZE));
                                    minY = topBounds;
                                    maxY = bottomBounds;
                                  }
                                  
                                  const constrainedY = Math.max(minY, Math.min(maxY, snappedY));
                                  return { x: line.x1, y: constrainedY };
                                } else {
                                  // Find the blocks that this specific line divides
                                  const affectedBlocks = findAffectedBlocks(line);
                                  const blocksLeft = affectedBlocks.filter(b => Math.abs(b.x + b.width - line.x1) < 1);
                                  const blocksRight = affectedBlocks.filter(b => Math.abs(b.x - line.x1) < 1);
                                  
                                  // Get the horizontal bounds from the affected blocks only
                                  let minX = line.x1;
                                  let maxX = line.x1;
                                  
                                  if (blocksLeft.length > 0 && blocksRight.length > 0) {
                                    const leftBounds = Math.max(...blocksLeft.map(b => b.x + MIN_SIZE));
                                    const rightBounds = Math.min(...blocksRight.map(b => b.x + b.width - MIN_SIZE));
                                    minX = leftBounds;
                                    maxX = rightBounds;
                                  }
                                  
                                  const constrainedX = Math.max(minX, Math.min(maxX, snappedX));
                                  return { x: constrainedX, y: line.y1 };
                                }
                              } : undefined}
                            />
                          );
                        })}
                      </Group>
                    </Layer>
                  </Stage>
                </div>
                
                <div className="text-xs text-slate-600 mt-1 space-y-1 flex-shrink-0">
                  <div className="flex justify-between">
                    <span>
                      <span className="font-semibold">Manufacturing Dimensions:</span> {formatInches32(manufacturingDimensions.width)} × {formatInches32(manufacturingDimensions.depth)} × {formatInches32(manufacturingDimensions.height)}
                      <span className="text-slate-500 ml-2">(Ordered: {formatInches32(dimensions.width)} × {formatInches32(dimensions.depth)} × {formatInches32(dimensions.height)})</span>
                    </span>
                    <span>Scale: {Math.round(scale * 100)}%</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-800 mb-0.5">Instructions</h4>
                    <div className="text-slate-500 space-y-0 text-xs">
                      <div>• Click on any compartment to select it</div>
                      <div>• Use "Add Row" to split horizontally</div>
                      <div>• Use "Add Column" to split vertically</div>
                      <div>• Drag the blue lines to adjust sizes</div>
                      <div>• All measurements are in inches</div>
                      <div>• Grid spacing is 0.25 inches</div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* 3D Preview Section */}
              <div className="flex-1 min-w-0 flex flex-col lg:border-l lg:border-slate-200 lg:pl-4  border-slate-200 pt-4 lg:pt-0">
                <div className="flex justify-between items-center mb-1 flex-shrink-0">
                  <h3 className="text-base font-semibold text-slate-900">3D Preview</h3>
                </div>
                
                {/* Spacer to match 2D controls height exactly */}
                <div className="mb-1.5 pb-1 border-b border-slate-200 flex-shrink-0" style={{ minHeight: '38px' }}></div>
                
                <div className="relative min-h-0 flex items-center justify-center bg-slate-50 border-2 border-slate-300 rounded overflow-hidden">
                  <ThreeJSWrapper 
                    selectedWoodType={selectedWoodType}
                    dimensions={manufacturingDimensions}
                    blocks={blocks}
                    splitLines={splitLines}
                    woodTypes={availableTextures}
                    threeRenderer={threeRenderer}
                  />
                </div>
                
                <div className="text-xs text-slate-600 mt-1 space-y-0 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span>
                      <span className="font-semibold">Manufacturing Dimensions:</span> {formatInches32(manufacturingDimensions.width)} × {formatInches32(manufacturingDimensions.depth)} × {formatInches32(manufacturingDimensions.height)}
                      <span className="text-slate-500 ml-2">(Ordered: {formatInches32(dimensions.width)} × {formatInches32(dimensions.depth)} × {formatInches32(dimensions.height)})</span>
                    </span>
                    <span className="font-medium text-slate-800">{availableTextures.find(t => t.id === selectedWoodType)?.name} Wood</span>
                  </div>
                  <div className="text-slate-500 text-center text-xs mt-0.5">
                    Interactive 3D Preview
                  </div>
                </div>
                
                {/* Add to Cart Button - Bottom Right */}
                <div className="mt-2 flex justify-end">
                  <AddToCartButton
                    design2DRef={stageRef}
                    threeRenderer={threeRenderer}
                    designState={{ blocks, splitLines }}
                    setDesignState={(state) => {
                      setBlocks(state.blocks);
                      setSplitLines(state.splitLines);
                    }}
                    defaultDesignState={defaultDesignState}
                    dimensions={dimensions}
                    layout={{ blocks, splitLines, selectedWoodType }}
                    className="py-2 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CanvasEditor; 