// src/components/WhiteboardItem.jsx
import React, { useState, useEffect, forwardRef } from 'react';
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
  Checkbox,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';

const Transition = forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const perfOptions = [
  { value: 'low', label: 'Low (1GB RAM, 1 CPU, 20GB Disk)' },
  { value: 'medium', label: 'Medium (2GB RAM, 2 CPU, 40GB Disk)' },
  { value: 'high', label: 'High (4GB RAM, 4 CPU, 80GB Disk)' },
];

export default function WhiteboardItem({
  item,
  roles,
  availableVlans,
  onRoleToggle,
  onVlanChange,
  onGroupChange,
  onAdvancedChange,
  onContextMenu,
  gridSize = 50,
}) {
  // Drag state
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'whiteboardItem',
    item: { ...item },
    collect: m => ({ isDragging: !!m.isDragging() }),
  }));

  // Popover for Roles/VLANs
  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);

  // Advanced dialog
  const [advOpen, setAdvOpen] = useState(false);

  // Extract current advanced settings
  const adv = item.advanced || {};
  const perf = adv.perf || 'medium';
  const monitoring = adv.monitoring ?? true;
  const username = adv.username || '';
  const sshKey = adv.sshKey || '';

  // Handlers
  const handleClick = e => setAnchorEl(e.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);

  const handleAdvOpen = () => {
    setAnchorEl(null);   // <-- close popover when advanced opens
    setAdvOpen(true);
  };
  const handleAdvClose = () => setAdvOpen(false);

  const handlePerfSelect = (value) =>
    onAdvancedChange(item.id, { ...adv, perf: value });

  const handleMonitorToggle = e =>
    onAdvancedChange(item.id, { ...adv, monitoring: e.target.checked });

  const handleUsernameChange = e =>
    onAdvancedChange(item.id, { ...adv, username: e.target.value });

  const handleSshKeyChange = e =>
    onAdvancedChange(item.id, { ...adv, sshKey: e.target.value });

  const size = gridSize;
  const baseType = item.id.split('-')[0];

  return (
    <>
      {/* Draggable Icon */}
      <Paper
        ref={drag}
        elevation={3}
        onClick={handleClick}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e); }}
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

      {/* Roles & VLAN Popover */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="h6" gutterBottom>
            {item.name}
          </Typography>

          {baseType === 'vmPack' ? (
            /* your VM-Pack UI… */
            <></>
          ) : (
            <>
              {/* Roles */}
              <Typography variant="subtitle1">Roles</Typography>
              {roles.map(r => (
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
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                VLANs
              </Typography>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VLANs</InputLabel>
                <Select
                  multiple
                  value={item.vlans}
                  onChange={e => onVlanChange(item.id, e.target.value)}
                  renderValue={vals => vals.join(', ')}
                >
                  {availableVlans.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      <Checkbox checked={item.vlans.includes(v.id)} />
                      <ListItemText primary={`${v.name} (${v.id})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Advanced button for Windows/Linux */}
              {(baseType === 'windowsServer' || baseType === 'linuxServer') && (
                <Box textAlign="right" sx={{ mt: 2 }}>
                  <Button variant="outlined" size="small" onClick={handleAdvOpen}>
                    Advanced…
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>

      {/* Advanced Settings Dialog */}
      <Dialog
        open={advOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleAdvClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            p: 2,
          }
        }}
      >
        <DialogTitle>Advanced Settings</DialogTitle>

        <DialogContent dividers>
          {/* Performance Tier as cards */}
          <Typography gutterBottom>Performance Tier</Typography>
          <Box display="flex" gap={2} mb={2}>
            {perfOptions.map(opt => (
              <Box
                key={opt.value}
                onClick={() => handlePerfSelect(opt.value)}
                sx={{
                  flex: 1,
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 1,
                  border: 2,
                  borderColor: perf === opt.value ? 'primary.main' : 'grey.300',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                <Typography variant="body2">{opt.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Monitoring Agent */}
          <FormControlLabel
            control={
              <Switch
                checked={monitoring}
                onChange={handleMonitorToggle}
              />
            }
            label="Monitoring Agent"
          />

          {/* SSH Username */}
          <TextField
            label="Username"
            fullWidth
            size="small"
            margin="dense"
            value={username}
            onChange={handleUsernameChange}
          />

          {/* SSH Public Key */}
          <TextField
            label="SSH Public Key"
            placeholder="ssh-rsa AAAA…"
            fullWidth
            size="small"
            margin="dense"
            multiline
            rows={3}
            value={sshKey}
            onChange={handleSshKeyChange}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleAdvClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
