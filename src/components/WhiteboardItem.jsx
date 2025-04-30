// src/components/WhiteboardItem.jsx
import React, { useState, forwardRef } from 'react';
import { useDrag } from 'react-dnd';
import {
  Paper,
  Popover,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  TextField,
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

  // Extract advanced settings or defaults
  const adv = item.advanced || {};
  const perf = adv.perf || 'medium';
  const monitoring = adv.monitoring ?? true;
  const username = adv.username || '';
  const sshKey = adv.sshKey || '';

  // Handlers
  const handleClick = e => setAnchorEl(e.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);

  const handleAdvOpen = () => {
    setAnchorEl(null);
    setAdvOpen(true);
  };
  const handleAdvClose = () => setAdvOpen(false);

  const handlePerfSelect = value =>
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
        sx={{
          position: 'absolute',
          left: item.left,
          top: item.top,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 2,
          borderColor: isDragging ? 'transparent' : 'primary.main',
          cursor: 'move',
          opacity: isDragging ? 0.5 : 1,
          zIndex: 10,
        }}
      >
        <Typography variant="h4">{item.icon}</Typography>
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
        <Box sx={{ p: 2, minWidth: 240 }}>
          <Typography variant="h6" gutterBottom>
            {item.name}
          </Typography>

          {baseType === 'vmPack' ? (
            /* VM-Pack UI… */
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

              {/* Advanced button */}
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
          },
        }}
      >
        <DialogTitle>Advanced Settings</DialogTitle>

        <DialogContent dividers>
          {/* Performance Tier Cards */}
          <Typography gutterBottom>Performance Tier</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {perfOptions.map(opt => (
              <Paper
                key={opt.value}
                elevation={perf === opt.value ? 8 : 2}
                onClick={() => handlePerfSelect(opt.value)}
                sx={{
                  flex: 1,
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: perf === opt.value
                    ? 'primary.main'
                    : 'background.paper',
                  border: perf === opt.value
                    ? '2px solid'
                    : '1px solid grey',
                  borderColor: perf === opt.value
                    ? 'primary.main'
                    : 'grey.300',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    boxShadow: 6,
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  color={perf === opt.value ? 'common.white' : 'text.primary'}
                >
                  {opt.label}
                </Typography>
              </Paper>
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
            sx={{ mb: 2 }}
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


          {/* SSH Public Key (no inner border) */}
          <TextField
            label="SSH Public Key"
            placeholder="ssh-rsa AAAA…"
            variant="standard"      // ← removes the box outline
            fullWidth
            size="small"
            margin="dense"
            multiline
            rows={3}
            value={sshKey}
            onChange={handleSshKeyChange}
            InputProps={{
              disableUnderline: true // ← also hide the underline if you want it totally borderless
            }}
            inputProps={{
              style: {
                padding: '8px',      // adds 8px of inner padding on all sides
              }
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleAdvClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
