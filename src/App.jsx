// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Box,
  Button,
  Paper,
  TextField,
  IconButton,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LegendItem from './components/LegendItem';
import Whiteboard from './components/Whiteboard';
import WhiteboardItem from './components/WhiteboardItem';
import DeleteArea from './components/DeleteArea';

// Legend definitions
const legendItems = [
  { id: 'windowsServer', name: 'Windows Server', icon: '🪟' },
  { id: 'linuxServer', name: 'Linux Server', icon: '🐧' },
  { id: 'networkSwitch', name: 'Network Switch', icon: '🔌' },
  { id: 'firewall', name: 'Firewall', icon: '🛡️' },
  { id: 'router', name: 'Router', icon: '📡' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'loadBalancer', name: 'Load Balancer', icon: '⚖️' },
  { id: 'webServer', name: 'Web Server', icon: '🌐' },
];

// Roles per device type
const roles = {
  windowsServer: ['ADDS', 'DNS', 'DHCP', 'IIS'],
  linuxServer: ['Web Server', 'Database', 'File Server'],
  networkSwitch: ['VLAN', 'Port Mirroring', 'QoS'],
  firewall: ['NAT', 'VPN', 'IPS'],
  router: ['OSPF', 'BGP', 'MPLS'],
  database: ['SQL', 'NoSQL', 'In-Memory'],
  loadBalancer: ['Round Robin', 'Least Connections', 'IP Hash'],
  webServer: ['Apache', 'Nginx', 'IIS'],
};

const GRID_SIZE = 50;

export default function App() {
  // Board state
  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const [occupiedCells, setOccupiedCells] = useState({});

  // VLAN definitions and form
  const [vlans, setVlans] = useState([{ id: 10, name: 'VLAN 10', color: '#3B82F6' }]);
  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [newVlanColor, setNewVlanColor] = useState('#ffffff');

  // Save-work confirmation
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const expirationTimeout = useRef(null);

  // Counter for generating unique IDs
  const itemCounters = useRef({});

  // Load saved state (if <10 mins old)
  useEffect(() => {
    const raw = localStorage.getItem('conceptify-state');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      localStorage.removeItem('conceptify-state');
      return;
    }
    const { whiteboardItems: savedItems, vlans: savedVlans } = parsed;
    setWhiteboardItems(savedItems);
    setVlans(savedVlans);

    // rebuild occupiedCells
    const occ = {};
    savedItems.forEach(i => {
      occ[`${i.left},${i.top}`] = i.id;
    });
    setOccupiedCells(occ);

    // rebuild itemCounters so we don’t reuse IDs
    const counters = {};
    savedItems.forEach(({ id }) => {
      const [base, num] = id.split('-');
      const n = parseInt(num, 10);
      if (!isNaN(n)) {
        counters[base] = Math.max(counters[base] || 0, n);
      }
    });
    itemCounters.current = counters;
  }, []);

  // Helpers
  const snapToGrid = (x, y) => [
    Math.round(x / GRID_SIZE) * GRID_SIZE,
    Math.round(y / GRID_SIZE) * GRID_SIZE,
  ];
  const getCellKey = (x, y) => `${x},${y}`;
  const isCellOccupied = (x, y, id) => {
    const occupant = occupiedCells[getCellKey(x, y)];
    return occupant && occupant !== id;
  };

  // Handle drag-and-drop
  const handleDrop = (item, left, top, inBounds) => {
    if (!inBounds) return;
    const [lx, ty] = snapToGrid(left, top);
    const key = getCellKey(lx, ty);
    if (isCellOccupied(lx, ty, item.id)) return;

    if (item.id.includes('-')) {
      // Move existing
      setWhiteboardItems(ws =>
        ws.map(i => (i.id === item.id ? { ...i, left: lx, top: ty } : i))
      );
      setOccupiedCells(prev => {
        const next = { ...prev };
        delete next[getCellKey(item.left, item.top)];
        next[key] = item.id;
        return next;
      });
    } else {
      // New from legend
      const base = item.id;
      const cnt = (itemCounters.current[base] || 0) + 1;
      itemCounters.current[base] = cnt;
      const newId = `${base}-${cnt}`;
      const newItem = {
        ...item,
        id: newId,
        left: lx,
        top: ty,
        roles: [],
        vlans: [],
      };
      setWhiteboardItems(ws => [...ws, newItem]);
      setOccupiedCells(o => ({ ...o, [key]: newId }));
    }
  };

  // Delete item
  const handleDeleteItem = id => {
    const it = whiteboardItems.find(i => i.id === id);
    if (it) {
      setOccupiedCells(prev => {
        const next = { ...prev };
        delete next[getCellKey(it.left, it.top)];
        return next;
      });
    }
    setWhiteboardItems(ws => ws.filter(i => i.id !== id));
  };

  // VLAN add & color-edit
  const handleAddVlan = () => {
    const num = parseInt(newVlanId, 10);
    if (!isNaN(num) && newVlanName.trim()) {
      setVlans(v => [...v, { id: num, name: newVlanName.trim(), color: newVlanColor }]);
      setNewVlanId('');
      setNewVlanName('');
      setNewVlanColor('#ffffff');
    }
  };
  const handleVlanColorChange = (id, color) => {
    setVlans(v => v.map(x => (x.id === id ? { ...x, color } : x)));
  };

  // Save work (10-minute TTL)
  const saveWork = () => {
    const payload = {
      timestamp: Date.now(),
      whiteboardItems,
      vlans,
    };
    localStorage.setItem('conceptify-state', JSON.stringify(payload));
    setSnackbarOpen(true);
    if (expirationTimeout.current) clearTimeout(expirationTimeout.current);
    expirationTimeout.current = setTimeout(() => {
      localStorage.removeItem('conceptify-state');
    }, 10 * 60 * 1000);
  };

  // Generate config JSON
  const generateConfigFiles = () => {
    const configs = whiteboardItems.reduce((acc, item) => {
      const type = item.id.split('-')[0];
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        id: item.id,
        roles: item.roles,
        vlans: item.vlans,
      });
      return acc;
    }, {});
    console.log('Generated Config:', JSON.stringify(configs, null, 2));
  };

  // Compute VLAN group frames
  const vlanBounds = vlans
    .map(vlan => {
      const members = whiteboardItems.filter(i => i.vlans.includes(vlan.id));
      if (!members.length) return null;
      const xs = members.map(i => i.left);
      const ys = members.map(i => i.top);
      const size = GRID_SIZE;
      const left = Math.min(...xs) - 8;
      const top = Math.min(...ys) - 8;
      const right = Math.max(...xs) + size + 8;
      const bottom = Math.max(...ys) + size + 8;
      return {
        ...vlan,
        style: { left, top, width: right - left, height: bottom - top },
      };
    })
    .filter(Boolean);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box className="flex flex-col h-screen bg-gray-100">
        <Box className="flex flex-grow">
          {/* Legend & VLAN panel */}
          <Paper elevation={3} className="w-64 p-4 overflow-y-auto">
            <Typography variant="h6">Legend</Typography>
            {legendItems.map(li => (
              <LegendItem key={li.id} {...li} />
            ))}

            <Box mt={4}>
              <Typography variant="h6">VLANs</Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TextField
                  label="ID"
                  size="small"
                  value={newVlanId}
                  onChange={e => setNewVlanId(e.target.value)}
                />
                <TextField
                  label="Name"
                  size="small"
                  value={newVlanName}
                  onChange={e => setNewVlanName(e.target.value)}
                />
                <input
                  type="color"
                  value={newVlanColor}
                  onChange={e => setNewVlanColor(e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', padding: 0 }}
                />
                <IconButton size="small" onClick={handleAddVlan}>
                  <AddIcon />
                </IconButton>
              </Box>
              {vlans.map(vlan => (
                <Box key={vlan.id} display="flex" alignItems="center" gap={1} mb={1}>
                  <Box width={16} height={16} borderRadius="50%" bgcolor={vlan.color} />
                  <Typography>{vlan.name} ({vlan.id})</Typography>
                  <input
                    type="color"
                    value={vlan.color}
                    onChange={e => handleVlanColorChange(vlan.id, e.target.value)}
                    style={{ marginLeft: 'auto', width: 24, height: 24, border: 'none', padding: 0 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Whiteboard area */}
          <Box className="flex flex-col flex-grow">
            <Whiteboard
              onDrop={handleDrop}
              gridSize={GRID_SIZE}
              occupiedCells={occupiedCells}
              className="flex-grow"
            >
              {/* VLAN group frames */}
              {vlanBounds.map(g => (
                <Box
                  key={g.id}
                  className="absolute rounded-lg pointer-events-none"
                  sx={{
                    border: `2px dashed ${g.color}`,
                    backgroundColor: `${g.color}22`,
                    zIndex: 1,
                    ...g.style,
                  }}
                  title={g.name}
                />
              ))}

              {/* Draggable items */}
              {whiteboardItems.map(item => (
                <WhiteboardItem
                  key={item.id}
                  item={item}
                  roles={roles[item.id.split('-')[0]]}
                  availableVlans={vlans}
                  onRoleToggle={(id, r) =>
                    setWhiteboardItems(ws =>
                      ws.map(i =>
                        i.id === id
                          ? {
                            ...i,
                            roles: i.roles.includes(r)
                              ? i.roles.filter(x => x !== r)
                              : [...i.roles, r],
                          }
                          : i
                      )
                    )
                  }
                  onVlanChange={(id, vs) =>
                    setWhiteboardItems(ws =>
                      ws.map(i =>
                        i.id === id
                          ? { ...i, vlans: vs }
                          : i
                      )
                    )
                  }
                  onContextMenu={(e, id) => {
                    e.preventDefault();
                    handleDeleteItem(id);
                  }}
                  gridSize={GRID_SIZE}
                />
              ))}

              <DeleteArea onDrop={i => handleDeleteItem(i.id)} />
            </Whiteboard>
          </Box>
        </Box>

        {/* Footer actions */}
        <Box p={2} display="flex" justifyContent="space-between">
          <Button variant="contained" color="primary" onClick={saveWork}>
            Save Work
          </Button>
          <Button variant="contained" color="secondary" onClick={generateConfigFiles}>
            Generate Config Files
          </Button>
        </Box>

        {/* Save confirmation */}
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Your work is saved for 10 minutes.
          </Alert>
        </Snackbar>
      </Box>
    </DndProvider>
  );
}
