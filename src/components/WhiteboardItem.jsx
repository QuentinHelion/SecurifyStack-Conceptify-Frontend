// src/components/WhiteboardItem.jsx
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import {
  Paper,
  Popover,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  ListItemText,
} from '@mui/material';

const vmOSOptions = ['Debian', 'Ubuntu', 'CentOS'];

export default function WhiteboardItem({
  item,
  roles,
  availableVlans,
  legendItems,
  onRoleToggle,
  onVlanChange,
  onGroupChange,
  onContextMenu,
  gridSize = 50,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [countValue, setCountValue] = useState(
    item.group && typeof item.group.count === 'number'
      ? String(item.group.count)
      : ''
  );
  const [countError, setCountError] = useState('');
  const open = Boolean(anchorEl);

  // Keep local state in sync if parent updates the count
  useEffect(() => {
    const cv =
      item.group && typeof item.group.count === 'number'
        ? String(item.group.count)
        : '';
    setCountValue(cv);
    if (cv === '') {
      setCountError('Count is required');
    } else {
      setCountError('');
    }
  }, [item.group?.count]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'whiteboardItem',
    item: { ...item },
    collect: (m) => ({ isDragging: !!m.isDragging() }),
  }));

  const size = gridSize;
  const baseType = item.id.split('-')[0];

  const handleCountChange = (e) => {
    const val = e.target.value;
    // allow only empty or 1–9
    if (val === '' || /^[1-9]$/.test(val)) {
      setCountValue(val);
      if (val === '') {
        setCountError('Count is required');
      } else {
        setCountError('');
        onGroupChange(item.id, {
          ...item.group,
          count: parseInt(val, 10),
        });
      }
    }
  };

  return (
    <>
      <Paper
        ref={drag}
        elevation={3}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e);
        }}
        className={`absolute p-2 cursor-move border-2 ${isDragging ? 'opacity-50' : 'border-blue-500'
          }`}
        style={{
          left: item.left,
          top: item.top,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <span className="text-2xl">{item.icon}</span>
      </Paper>

      <Popover
        id={open ? `popover-${item.id}` : undefined}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{ root: { 'aria-hidden': 'false' } }}
      >
        <div className="p-4" style={{ minWidth: 220 }}>
          <Typography variant="h6">{item.name}</Typography>

          {baseType === 'vmPack' ? (
            <>
              {/* Count: must be 1–9, not empty */}
              <TextField
                label="Count"
                type="text"
                size="small"
                fullWidth
                margin="dense"
                value={countValue}
                onChange={handleCountChange}
                error={!!countError}
                helperText={countError}
                inputProps={{
                  maxLength: 1,
                  inputMode: 'numeric',
                  pattern: '[1-9]',
                }}
              />

              {/* VM OS */}
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VM OS</InputLabel>
                <Select
                  label="VM OS"
                  value={item.group.os}
                  onChange={(e) =>
                    onGroupChange(item.id, {
                      ...item.group,
                      os: e.target.value,
                    })
                  }
                >
                  {vmOSOptions.map((os) => (
                    <MenuItem key={os} value={os}>
                      {os}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* VLANs */}
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VLANs</InputLabel>
                <Select
                  multiple
                  value={item.group.vlans}
                  onChange={(e) =>
                    onGroupChange(item.id, {
                      ...item.group,
                      vlans: e.target.value,
                    })
                  }
                  renderValue={(sel) => (sel || []).join(', ')}
                >
                  {availableVlans.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      <Checkbox checked={item.group.vlans.includes(v.id)} />
                      <ListItemText primary={`${v.name} (${v.id})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              {/* Roles */}
              <Typography variant="subtitle1">Roles</Typography>
              {roles.map((r) => (
                <FormControlLabel
                  key={r}
                  control={
                    <Checkbox
                      checked={item.roles.includes(r)}
                      onChange={() => onRoleToggle(item.id, r)}
                    />
                  }
                  label={r}
                />
              ))}

              {/* VLANs */}
              <Typography variant="subtitle1">VLANs</Typography>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VLANs</InputLabel>
                <Select
                  multiple
                  value={item.vlans}
                  onChange={(e) => onVlanChange(item.id, e.target.value)}
                  renderValue={(sel) => sel.join(', ')}
                >
                  {availableVlans.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      <Checkbox checked={item.vlans.includes(v.id)} />
                      <ListItemText primary={`${v.name} (${v.id})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </div>
      </Popover>
    </>
  );
}
