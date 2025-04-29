// components/Whiteboard.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { Paper } from '@mui/material';

export default function Whiteboard({
  children,
  onDrop,
  className,
  gridSize,
  occupiedCells = {},       // ← default to empty object
}) {
  const whiteboardRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  // keep track of container size for grid drawing
  useEffect(() => {
    const update = () => {
      if (!whiteboardRef.current) return;
      setDims({
        width: whiteboardRef.current.offsetWidth,
        height: whiteboardRef.current.offsetHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const snapCoord = (raw) => Math.round(raw / gridSize) * gridSize;
  const getCellKey = (x, y) => `${x},${y}`;

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['legendItem', 'whiteboardItem'],

    // Decide whether a drop is allowed
    canDrop: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      const node = whiteboardRef.current;
      if (!offset || !node) return false;

      const rect = node.getBoundingClientRect();
      const rawX = offset.x - rect.left;
      const rawY = offset.y - rect.top;

      // 1) must be inside the board
      if (rawX < 0 || rawY < 0 || rawX > rect.width || rawY > rect.height) {
        return false;
      }

      // 2) snap to the nearest grid cell
      const x = snapCoord(rawX);
      const y = snapCoord(rawY);
      const key = getCellKey(x, y);

      // 3) allow if cell is empty, or if you're dragging the very same item from that cell
      const occupiedBy = occupiedCells[key];
      return !occupiedBy || occupiedBy === item.id;
    },

    // Actually handle the drop
    drop: (item, monitor) => {
      const offset = monitor.getSourceClientOffset();
      const node = whiteboardRef.current;
      if (!offset || !node) return;
      const rect = node.getBoundingClientRect();
      const left = offset.x - rect.left;
      const top = offset.y - rect.top;
      onDrop(item, left, top, true);
    },

    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [occupiedCells, gridSize]);

  // Pre-render your grid lines
  const gridLines = [];
  for (let x = gridSize; x < dims.width; x += gridSize) {
    gridLines.push(
      <div
        key={`v-${x}`}
        className="absolute border-r border-gray-200"
        style={{ left: x, top: 0, height: '100%' }}
      />
    );
  }
  for (let y = gridSize; y < dims.height; y += gridSize) {
    gridLines.push(
      <div
        key={`h-${y}`}
        className="absolute border-b border-gray-200"
        style={{ top: y, left: 0, width: '100%' }}
      />
    );
  }

  return (
    <Paper
      ref={el => {
        drop(el);
        whiteboardRef.current = el;
      }}
      id="whiteboard"
      className={`relative ${className}`}
      elevation={3}
    >
      {/* show a light-red overlay if you’re hovering but cannot drop here */}
      {isOver && !canDrop && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,0,0,0.1)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}

      {gridLines}
      {children}
    </Paper>
  );
}
