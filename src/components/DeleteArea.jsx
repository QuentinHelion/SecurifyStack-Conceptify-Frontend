// components/DeleteArea.jsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function DeleteArea({ onDrop }) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'whiteboardItem',
        drop: (item) => {
            onDrop(item);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <Paper
            ref={drop}
            elevation={3}
            className={`p-4 mt-2 text-center ${isOver ? 'bg-red-100' : 'bg-gray-100'
                } flex items-center justify-center transition-colors`}
            style={{ height: '60px' }}
        >
            <DeleteIcon className={`mr-2 ${isOver ? 'text-red-600' : 'text-gray-600'}`} />
            <span className={isOver ? 'text-red-600 font-bold' : 'text-gray-600'}>
                {isOver ? 'Release to Delete' : 'Drag Here to Delete'}
            </span>
        </Paper>
    );
}

export default DeleteArea;