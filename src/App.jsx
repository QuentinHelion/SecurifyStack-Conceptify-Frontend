// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Paper, Typography } from '@mui/material';
import LegendItem from './components/LegendItem';
import VlanPanel from './components/VlanPanel';
import BoardView from './components/BoardView';
import FooterActions from './components/FooterActions';

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
  // ——— State ———
  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const [occupiedCells, setOccupiedCells] = useState({});

  const [vlans, setVlans] = useState([{ id: 10, name: 'VLAN 10', color: '#3B82F6' }]);
  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [newVlanColor, setNewVlanColor] = useState('#ffffff');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const expirationTimeout = useRef(null);
  const itemCounters = useRef({});

  // ——— Load / hydrate on mount ———
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
    savedItems.forEach(i => { occ[`${i.left},${i.top}`] = i.id });
    setOccupiedCells(occ);

    // rebuild counters so we never re-use IDs
    const counters = {};
    savedItems.forEach(({ id }) => {
      const [base, num] = id.split('-');
      const n = parseInt(num, 10);
      if (!isNaN(n)) counters[base] = Math.max(counters[base] || 0, n);
    });
    itemCounters.current = counters;
  }, []);

  // ——— Helpers ———
  const snapToGrid = (x, y) => [Math.round(x / GRID_SIZE) * GRID_SIZE, Math.round(y / GRID_SIZE) * GRID_SIZE];
  const getCellKey = (x, y) => `${x},${y}`;
  const isOccupied = (x, y, id) => {
    const o = occupiedCells[getCellKey(x, y)];
    return o && o !== id;
  };

  // ——— Handlers ———
  const handleDrop = (item, left, top, inBounds) => {
    if (!inBounds) return;
    const [lx, ty] = snapToGrid(left, top);
    const key = getCellKey(lx, ty);
    if (isOccupied(lx, ty, item.id)) return;

    if (item.id.includes('-')) {
      // move existing
      setWhiteboardItems(ws =>
        ws.map(i => i.id === item.id ? { ...i, left: lx, top: ty } : i)
      );
      setOccupiedCells(prev => {
        const nxt = { ...prev };
        delete nxt[getCellKey(item.left, item.top)];
        nxt[key] = item.id;
        return nxt;
      });
    } else {
      // new from legend
      const base = item.id;
      const cnt = (itemCounters.current[base] || 0) + 1;
      itemCounters.current[base] = cnt;
      const newId = `${base}-${cnt}`;
      const newItem = { ...item, id: newId, left: lx, top: ty, roles: [], vlans: [] };
      setWhiteboardItems(ws => [...ws, newItem]);
      setOccupiedCells(o => ({ ...o, [key]: newId }));
    }
  };

  const handleDeleteItem = id => {
    const it = whiteboardItems.find(i => i.id === id);
    if (it) {
      setOccupiedCells(prev => {
        const nxt = { ...prev };
        delete nxt[getCellKey(it.left, it.top)];
        return nxt;
      });
    }
    setWhiteboardItems(ws => ws.filter(i => i.id !== id));
  };

  // VLAN panel
  const handleAddVlan = () => {
    const num = parseInt(newVlanId, 10);
    if (!isNaN(num) && newVlanName.trim()) {
      setVlans(v => [...v, { id: num, name: newVlanName.trim(), color: newVlanColor }]);
      setNewVlanId(''); setNewVlanName(''); setNewVlanColor('#ffffff');
    }
  };
  const handleVlanColorChange = (id, color) => {
    setVlans(v => v.map(x => x.id === id ? { ...x, color } : x));
  };

  // Save work
  const saveWork = () => {
    const payload = { timestamp: Date.now(), whiteboardItems, vlans };
    localStorage.setItem('conceptify-state', JSON.stringify(payload));
    setSnackbarOpen(true);
    if (expirationTimeout.current) clearTimeout(expirationTimeout.current);
    expirationTimeout.current = setTimeout(() => {
      localStorage.removeItem('conceptify-state');
    }, 10 * 60 * 1000);
  };

  // Generate config
  const generateConfigFiles = () => {
    const configs = whiteboardItems.reduce((acc, item) => {
      const type = item.id.split('-')[0];
      if (!acc[type]) acc[type] = [];
      acc[type].push({ id: item.id, roles: item.roles, vlans: item.vlans });
      return acc;
    }, {});
    console.log('Generated Config:', JSON.stringify(configs, null, 2));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box className="flex flex-col h-screen bg-gray-100">
        <Box className="flex flex-grow">
          <Paper elevation={3} className="w-64 p-4 overflow-y-auto">
            <Typography variant="h6">Legend</Typography>
            {legendItems.map(li => (
              <LegendItem key={li.id} id={li.id} name={li.name} icon={li.icon} />
            ))}

            <VlanPanel
              vlans={vlans}
              newVlanId={newVlanId}
              setNewVlanId={setNewVlanId}
              newVlanName={newVlanName}
              setNewVlanName={setNewVlanName}
              newVlanColor={newVlanColor}
              setNewVlanColor={setNewVlanColor}
              onAddVlan={handleAddVlan}
              onColorChange={handleVlanColorChange}
            />
          </Paper>

          <BoardView
            whiteboardItems={whiteboardItems}
            vlans={vlans}
            rolesMap={roles}                     // rename here
            gridSize={GRID_SIZE}
            occupiedCells={occupiedCells}
            onDrop={handleDrop}
            onDeleteItem={handleDeleteItem}
            onRoleToggle={(id, role) =>
              setWhiteboardItems(ws =>
                ws.map(i =>
                  i.id === id
                    ? {
                      ...i,
                      roles: i.roles.includes(role)
                        ? i.roles.filter(r => r !== role)
                        : [...i.roles, role],
                    }
                    : i
                )
              )
            }
            onVlanChange={(id, vlans) =>
              setWhiteboardItems(ws =>
                ws.map(i =>
                  i.id === id ? { ...i, vlans } : i
                )
              )
            }
          />
        </Box>

        <FooterActions
          onSaveWork={saveWork}
          onGenerateConfig={generateConfigFiles}
          snackbarOpen={snackbarOpen}
          onCloseSnackbar={() => setSnackbarOpen(false)}
        />
      </Box>
    </DndProvider>
  );
}
