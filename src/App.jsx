import React, { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Paper,
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LegendItem from './components/LegendItem';
import Whiteboard from './components/Whiteboard';
import WhiteboardItem from './components/WhiteboardItem';
import DeleteArea from './components/DeleteArea';

// Legend items for drag-and-drop
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

// Roles per type
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

// Grid settings
const GRID_SIZE = 50;

export default function App() {
  // Whiteboard items and occupancy map
  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const [occupiedCells, setOccupiedCells] = useState({});

  // VLAN definitions
  const [vlans, setVlans] = useState([
    { id: 10, name: 'VLAN 10', color: '#3B82F6' },
  ]);

  // New VLAN form inputs
  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [newVlanColor, setNewVlanColor] = useState('#ffffff');

  // Track per-type counters for unique IDs
  const itemCounters = useRef({});

  // === DND & board helpers ===
  const snapToGrid = (x, y) => [
    Math.round(x / GRID_SIZE) * GRID_SIZE,
    Math.round(y / GRID_SIZE) * GRID_SIZE,
  ];

  const getCellKey = (x, y) => `${x},${y}`;

  const isCellOccupied = (x, y, movingItemId) => {
    const key = getCellKey(x, y);
    const occupiedBy = occupiedCells[key];
    return occupiedBy && occupiedBy !== movingItemId;
  };

  // Handle drop (both new legend items and moving existing ones)
  const handleDrop = (item, left, top, isWithinBounds) => {
    if (!isWithinBounds) return;

    const [snappedLeft, snappedTop] = snapToGrid(left, top);
    const cellKey = getCellKey(snappedLeft, snappedTop);

    // Prevent overlap
    if (isCellOccupied(snappedLeft, snappedTop, item.id)) {
      return;
    }

    if (item.id.includes('-')) {
      // Move existing
      setWhiteboardItems(ws =>
        ws.map(i =>
          i.id === item.id
            ? { ...i, left: snappedLeft, top: snappedTop }
            : i
        )
      );
      setOccupiedCells(prev => {
        const next = { ...prev };
        const oldKey = getCellKey(item.left, item.top);
        delete next[oldKey];
        next[cellKey] = item.id;
        return next;
      });

    } else {
      // New item from legend
      const baseType = item.id;
      const count = (itemCounters.current[baseType] || 0) + 1;
      itemCounters.current[baseType] = count;
      const newItemId = `${baseType}-${count}`;

      const newItem = {
        ...item,
        id: newItemId,
        left: snappedLeft,
        top: snappedTop,
        roles: [],
        vlans: [],
      };

      setWhiteboardItems(ws => [...ws, newItem]);
      setOccupiedCells(prev => ({ ...prev, [cellKey]: newItemId }));
    }
  };

  const handleDeleteItem = (itemId) => {
    const item = whiteboardItems.find(i => i.id === itemId);
    if (item) {
      const key = getCellKey(item.left, item.top);
      setOccupiedCells(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setWhiteboardItems(ws => ws.filter(i => i.id !== itemId));
  };

  // === VLAN management ===
  const handleAddVlan = () => {
    const idNum = parseInt(newVlanId, 10);
    if (!isNaN(idNum) && newVlanName.trim()) {
      setVlans(v => [...v, { id: idNum, name: newVlanName.trim(), color: newVlanColor }]);
      setNewVlanId('');
      setNewVlanName('');
      setNewVlanColor('#ffffff');
    }
  };

  const handleVlanColorChange = (id, color) => {
    setVlans(v => v.map(x => x.id === id ? { ...x, color } : x));
  };

  // === Compute VLAN bounding frames ===
  const vlanBounds = vlans.map(vlan => {
    const members = whiteboardItems.filter(item => (item.vlans || []).includes(vlan.id));
    if (!members.length) return null;

    const xs = members.map(i => i.left);
    const ys = members.map(i => i.top);
    const size = GRID_SIZE * 2;

    const left = Math.min(...xs) - 8;
    const top = Math.min(...ys) - 8;
    const right = Math.max(...xs) + size + 8;
    const bottom = Math.max(...ys) + size + 8;

    return {
      id: vlan.id,
      name: vlan.name,
      color: vlan.color,
      style: { left, top, width: right - left, height: bottom - top }
    };
  }).filter(Boolean);

  // === Save progress → download JSON ===
  const saveProgress = () => {
    const data = { whiteboardItems, vlans };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conceptify-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box className="flex flex-col h-screen bg-gray-100">
        <Box className="flex flex-grow">
          {/* Legend panel including VLAN controls */}
          <Paper elevation={3} className="w-64 p-4 overflow-y-auto">
            <Typography variant="h6" gutterBottom>Legend</Typography>
            {legendItems.map(li => (
              <LegendItem key={li.id} {...li} />
            ))}

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>VLANs</Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TextField
                  label="ID"
                  value={newVlanId}
                  onChange={e => setNewVlanId(e.target.value)}
                  size="small"
                />
                <TextField
                  label="Name"
                  value={newVlanName}
                  onChange={e => setNewVlanName(e.target.value)}
                  size="small"
                />
                <input
                  type="color"
                  value={newVlanColor}
                  onChange={e => setNewVlanColor(e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', padding: 0 }}
                />
                <IconButton onClick={handleAddVlan} size="small">
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
              className="flex-grow"
              gridSize={GRID_SIZE}
              occupiedCells={occupiedCells}
            >
              {/* VLAN grouping backdrops */}
              {vlanBounds.map(group => (
                <Box
                  key={group.id}
                  className="absolute rounded-lg pointer-events-none"
                  sx={{
                    border: `2px dashed ${group.color}`,
                    backgroundColor: `${group.color}22`,
                    zIndex: 1,
                    ...group.style,
                  }}
                  title={group.name}
                />
              ))}

              {/* Whiteboard items */}
              {whiteboardItems.map(item => (
                <WhiteboardItem
                  key={item.id}
                  item={item}
                  roles={roles[item.id.split('-')[0]]}
                  onRoleToggle={(id, role) => {
                    setWhiteboardItems(ws =>
                      ws.map(i =>
                        i.id === id
                          ? {
                            ...i, roles: i.roles.includes(role)
                              ? i.roles.filter(r => r !== role)
                              : [...i.roles, role]
                          }
                          : i
                      )
                    );
                  }}
                  onContextMenu={(e, id) => {
                    e.preventDefault(); handleDeleteItem(id);
                  }}
                  gridSize={GRID_SIZE}
                />
              ))}

              <DeleteArea onDrop={item => handleDeleteItem(item.id)} />
            </Whiteboard>
          </Box>
        </Box>

        {/* Footer controls */}
        <Box display="flex" justifyContent="space-between" p={2}>
          <Button variant="contained" color="primary" onClick={saveProgress}>
            Save Progress
          </Button>
          <Button variant="contained" color="secondary" onClick={() => {/* your generateConfigFiles here */ }}>
            Generate Config Files
          </Button>
        </Box>
      </Box>
    </DndProvider>
  );
}
