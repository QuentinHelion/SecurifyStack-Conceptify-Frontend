// components/WhiteboardItem.jsx
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Paper, Popover, FormControlLabel, Checkbox, Typography } from '@mui/material';

function WhiteboardItem({ item, roles, onRoleToggle, onContextMenu }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'whiteboardItem',
    // spread the entire item so icon & name never get lost
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleRightClick = (event) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(event, item.id);
    }
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? `popover-${item.id}` : undefined;

  return (
    <>
      <Paper
        ref={drag}
        elevation={3}
        className={`absolute p-2 cursor-move border-2 ${isDragging ? 'opacity-50' : 'border-blue-500'
          }`}
        style={{
          left: item.left,
          top: item.top,
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      >
        <span className="text-2xl">{item.icon}</span>
      </Paper>

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <div className="p-4">
          <Typography variant="h6">{item.name}</Typography>
          <div className="mt-2">
            <Typography variant="subtitle1">Roles:</Typography>
            {roles.map((role) => (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    checked={item.roles.includes(role)}
                    onChange={() => onRoleToggle(item.id, role)}
                  />
                }
                label={role}
              />
            ))}
          </div>
        </div>
      </Popover>
    </>
  );
}

export default WhiteboardItem;
