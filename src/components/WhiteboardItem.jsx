import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  Paper,
  Popover,
  Typography,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  ListItemText,
} from '@mui/material';

export default function WhiteboardItem({
  item,
  roles,
  availableVlans,
  onRoleToggle,
  onVlanChange,
  onContextMenu,
  gridSize = 50,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'whiteboardItem',
    item: { ...item },
    collect: m => ({ isDragging: !!m.isDragging() }),
  }));

  const size = gridSize; // 1×1
  const handleClick = e => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleRight = e => { e.preventDefault(); onContextMenu?.(e, item.id); };

  return (
    <>
      <Paper
        ref={drag}
        onClick={handleClick}
        onContextMenu={handleRight}
        elevation={3}
        className={`absolute p-2 cursor-move border-2 ${isDragging ? 'opacity-50' : 'border-blue-500'
          }`}
        style={{ left: item.left, top: item.top, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
      >
        <span className="text-2xl">{item.icon}</span>
      </Paper>

      <Popover
        id={open ? `popover-${item.id}` : undefined}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{ root: { 'aria-hidden': 'false' } }}
      >
        <div className="p-4">
          <Typography variant="h6">{item.name}</Typography>

          <Typography variant="subtitle1" className="mt-2">Roles:</Typography>
          {roles.map(r => (
            <FormControlLabel
              key={r}
              control={<Checkbox checked={item.roles.includes(r)} onChange={() => onRoleToggle(item.id, r)} />}
              label={r}
            />
          ))}

          <Typography variant="subtitle1" className="mt-4">VLANs:</Typography>
          <Select
            multiple fullWidth
            value={item.vlans || []}
            onChange={e => onVlanChange(item.id, e.target.value)}
            renderValue={selected => selected.map(v => `VLAN ${v}`).join(', ')}
          >
            {availableVlans.map(v => (
              <MenuItem key={v.id} value={v.id}>
                <Checkbox checked={(item.vlans || []).includes(v.id)} />
                <ListItemText primary={`${v.name} (${v.id})`} />
              </MenuItem>
            ))}
          </Select>
        </div>
      </Popover>
    </>
  );
}