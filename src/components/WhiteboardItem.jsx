// src/components/WhiteboardItem.jsx
import React, { useState, useEffect, forwardRef } from 'react';
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
  Radio,
  RadioGroup,
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

  // Popover
  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);

  // Advanced dialog
  const [advOpen, setAdvOpen] = useState(false);

  // Pull advanced or defaults
  const adv = item.advanced || {};
  const perf = adv.perf || 'medium';
  const monitoring = adv.monitoring ?? true;
  const username = adv.username || '';
  const sshKey = adv.sshKey || '';
  const ipMode = adv.ipMode || 'dhcp';
  const ipAddress = adv.ipAddress || '';
  const subnetMask = adv.subnetMask || '24';

  // Local IP + validation
  const [localIp, setLocalIp] = useState(ipAddress);
  const [ipError, setIpError] = useState('');

  useEffect(() => {
    setLocalIp(ipAddress);
    setIpError('');
  }, [ipAddress, ipMode]);

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

  const handleIpModeChange = e =>
    onAdvancedChange(item.id, {
      ...adv,
      ipMode: e.target.value,
      ipAddress: '',
      // keep existing mask or default to 24
      subnetMask: adv.subnetMask || '24',
    });

  const handleIpAddressChange = e => {
    const val = e.target.value;
    setLocalIp(val);

    // IPv4 regex
    const ipv4 = /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/;
    if (!val) {
      setIpError('IP address is required');
    } else if (!ipv4.test(val)) {
      setIpError('Invalid IPv4 address');
    } else {
      setIpError('');
      onAdvancedChange(item.id, { ...adv, ipMode: 'static', ipAddress: val });
    }
  };

  const handleMaskChange = e =>
    onAdvancedChange(item.id, { ...adv, subnetMask: e.target.value });

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
            <>
              <Typography variant="subtitle1" gutterBottom>
                Pack de VMs
              </Typography>

              {/* Nombre de VMs */}
              <TextField
                label="Nombre"
                type="number"
                fullWidth
                size="small"
                margin="dense"
                inputProps={{ min: 1, max: 10 }}
                value={item.group?.count || ''}
                onChange={e => {
                  const count = parseInt(e.target.value, 10) || 1;
                  onGroupChange(item.id, {
                    ...item.group,
                    count: Math.min(Math.max(count, 1), 10)
                  });
                }}
              />

              {/* Sélection OS */}
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>OS</InputLabel>
                <Select
                  value={item.group?.templateType || ''}
                  label="OS"
                  onChange={e =>
                    onGroupChange(item.id, {
                      ...item.group,
                      templateType: e.target.value
                    })
                  }
                >
                  <MenuItem value="debian">Debian</MenuItem>
                  <MenuItem value="ubuntu">Ubuntu</MenuItem>
                  <MenuItem value="centos">CentOS</MenuItem>
                </Select>
              </FormControl>

              {/* VLANs partagés */}
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VLANs</InputLabel>
                <Select
                  multiple
                  value={item.vlans}
                  renderValue={vals => vals.join(', ')}
                  onChange={e => onVlanChange(item.id, e.target.value)}
                >
                  {availableVlans.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      <Checkbox checked={item.vlans.includes(v.id)} />
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
          sx: { borderRadius: 2, bgcolor: 'background.paper', p: 2 },
        }}
      >
        <DialogTitle>Advanced Settings</DialogTitle>

        <DialogContent dividers>
          {/* Performance Tier Cards */}
          <Typography gutterBottom>Performance Tier</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {perfOptions.map(opt => (
              <Paper
                key={opt.value}
                elevation={perf === opt.value ? 8 : 2}
                onClick={() => handlePerfSelect(opt.value)}
                sx={{
                  flex: 1, p: 2, textAlign: 'center', borderRadius: 2,
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
                  color: perf === opt.value
                    ? 'common.white'
                    : 'text.primary',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'scale(1.15)', boxShadow: 6
                  },
                }}
              >
                <Typography variant="subtitle2">
                  {opt.label}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Monitoring Agent */}
          <FormControlLabel
            control={<Switch checked={monitoring} onChange={handleMonitorToggle} />}
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

          {/* SSH Public Key */}
          <TextField
            label="SSH Public Key"
            placeholder="ssh-rsa AAAA…"
            variant="standard"
            fullWidth
            size="small"
            margin="dense"
            multiline
            rows={3}
            value={sshKey}
            onChange={handleSshKeyChange}
            InputProps={{ disableUnderline: true }}
            inputProps={{ style: { padding: '8px' } }}
          />

          {/* IP Configuration */}
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            IP Configuration
          </Typography>
          <RadioGroup row value={ipMode} onChange={handleIpModeChange} sx={{ mb: 1 }}>
            <FormControlLabel value="dhcp" control={<Radio />} label="DHCP" />
            <FormControlLabel value="static" control={<Radio />} label="Static" />
          </RadioGroup>

          {ipMode === 'static' && (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={ipError ? 0 : 2}>
                {/* IP field is now flex:2 */}
                <TextField
                  label="IP Address"
                  placeholder="192.168.1.10"
                  size="small"
                  margin="dense"
                  value={localIp}
                  onChange={handleIpAddressChange}
                  error={!!ipError}
                  sx={{ flex: 2 }}
                />
                <Typography>/</Typography>
                {/* Mask field is now flex:1 */}
                <FormControl size="small" margin="dense" sx={{ flex: 1 }}>
                  <InputLabel>Mask</InputLabel>
                  <Select
                    value={subnetMask}
                    label="Mask"
                    onChange={handleMaskChange}
                  >
                    {Array.from({ length: 33 }, (_, i) => String(i)).map(m => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {ipError && (
                <Typography color="error" variant="caption">
                  {ipError}
                </Typography>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleAdvClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
