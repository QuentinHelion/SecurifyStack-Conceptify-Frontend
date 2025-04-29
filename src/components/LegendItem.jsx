// components/LegendItem.jsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { Paper } from '@mui/material';

function LegendItem({ id, name, icon }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'legendItem',
    item: { id, name, icon },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Paper
      ref={drag}
      elevation={2}
      className={`p-2 mb-2 cursor-move flex items-center ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="text-2xl mr-2">{icon}</span>
      <span>{name}</span>
    </Paper>
  );
}

export default LegendItem;