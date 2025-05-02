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
  { id: 'windows10', name: 'Windows 10', icon: '💻' },
  { id: 'windows11', name: 'Windows 11', icon: '🖥️' },
  { id: 'linuxServer', name: 'Linux Server', icon: '🐧' },
  { id: 'networkSwitch', name: 'Network Switch', icon: '🔌' },
  { id: 'firewall', name: 'Firewall', icon: '🛡️' },
  { id: 'router', name: 'Router', icon: '📡' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'loadBalancer', name: 'Load Balancer', icon: '⚖️' },
  { id: 'siemWazuh', name: '  Wazuh', icon: '🔍' },
  { id: 'webServer', name: 'Web Server', icon: '🌐' },
  { id: 'vmPack', name: 'VM Pack', icon: '📁' },
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

// initial VLAN list
const initialVlans = [
  { id: 10, name: 'VLAN 10', color: '#3B82F6' },
  { id: 20, name: 'VLAN 20', color: '#F59E0B' },
  { id: 30, name: 'VLAN 30', color: '#EF4444' },
  { id: 40, name: 'VLAN 40', color: '#10B981' },
];

export default function App() {
  // board state
  const [whiteboardItems, setWhiteboardItems] = useState([]);
  const [occupiedCells, setOccupiedCells] = useState({});

  // VLAN state
  const [vlans, setVlans] = useState(initialVlans);
  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [newVlanColor, setNewVlanColor] = useState('#ffffff');

  // save/snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const expirationTimeout = useRef(null);

  // ID counters for legend items
  const itemCounters = useRef({});

  // load saved state (10-min TTL)
  useEffect(() => {
    const raw = localStorage.getItem('conceptify-state');
    if (!raw) return;
    const { timestamp, whiteboardItems: savedItems, vlans: savedVlans } = JSON.parse(raw);
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      localStorage.removeItem('conceptify-state');
      return;
    }
    setWhiteboardItems(savedItems);
    setVlans(savedVlans);

    // rebuild occupiedCells
    const occ = {};
    savedItems.forEach(i => { occ[`${i.left},${i.top}`] = i.id });
    setOccupiedCells(occ);

    // rebuild itemCounters
    const cnts = {};
    savedItems.forEach(({ id }) => {
      const [base, num] = id.split('-');
      const n = parseInt(num, 10);
      if (!isNaN(n)) cnts[base] = Math.max(cnts[base] || 0, n);
    });
    itemCounters.current = cnts;
  }, []);

  // helpers
  const snapToGrid = (x, y) => [
    Math.round(x / GRID_SIZE) * GRID_SIZE,
    Math.round(y / GRID_SIZE) * GRID_SIZE
  ];
  const getCellKey = (x, y) => `${x},${y}`;
  const isOccupied = (x, y, id) => {
    const occ = occupiedCells[getCellKey(x, y)];
    return occ && occ !== id;
  };

  // drop handler
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
      setOccupiedCells(o => {
        const nxt = { ...o };
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
      const newItem = {
        ...item,
        id: newId,
        left: lx,
        top: ty,
        roles: [],
        vlans: [],
        ...(base === 'vmPack'
          ? { group: { count: '', os: 'Debian', vlans: [] } }
          : {}
        )
      };
      setWhiteboardItems(ws => [...ws, newItem]);
      setOccupiedCells(o => ({ ...o, [key]: newId }));
    }
  };

  // delete handler
  const handleDeleteItem = id => {
    const it = whiteboardItems.find(i => i.id === id);
    if (it) {
      setOccupiedCells(o => {
        const nxt = { ...o };
        delete nxt[getCellKey(it.left, it.top)];
        return nxt;
      });
    }
    setWhiteboardItems(ws => ws.filter(i => i.id !== id));
  };

  // VLAN handlers
  const handleAddVlan = () => {
    const idNum = parseInt(newVlanId, 10);
    if (!isNaN(idNum)) {
      setVlans(v => [...v, { id: idNum, name: newVlanName.trim(), color: newVlanColor }]);
      setNewVlanId(''); setNewVlanName(''); setNewVlanColor('#ffffff');
    }
  };
  const handleVlanColorChange = (id, color) => {
    setVlans(v => v.map(x => x.id === id ? { ...x, color } : x));
  };

  // save work
  const saveWork = () => {
    const payload = { timestamp: Date.now(), whiteboardItems, vlans };
    localStorage.setItem('conceptify-state', JSON.stringify(payload));
    setSnackbarOpen(true);
    clearTimeout(expirationTimeout.current);
    expirationTimeout.current = setTimeout(() => {
      localStorage.removeItem('conceptify-state');
    }, 10 * 60 * 1000);
  };

  // clear cache
  const handleClearCache = () => {
    localStorage.removeItem('conceptify-state');
    setWhiteboardItems([]);
    setOccupiedCells({});
    setVlans(initialVlans);
  };

  // generate JSON
  const generateConfigFiles = () => {
    const configs = whiteboardItems.reduce((acc, item) => {
      const type = item.id.split('-')[0];
      if (!acc[type]) acc[type] = [];

      const adv = item.advanced || {};
      const advancedData = {
        perf: adv.perf ?? 'medium',
        mon_agent: adv.monitoring ?? true,
        username: adv.username?.trim() || 'user',
        sshKey: adv.sshKey?.trim() || '',
        ip_mode: adv.ipMode ?? 'dhcp',
        ip_address: adv.ipAddress?.trim() || '',
        subnet_mask: adv.subnetMask || '',
        os_version:
          adv.osVersion
          ?? (type === 'windows10' ? 'Windows 10'
            : type === 'windows11' ? 'Windows 11'
              : ''),
      };

      const baseEntry = {
        id: item.id,
        roles: item.roles,
        vlans: item.vlans,
        advanced: advancedData,
      };

      if (item.group && type === 'vmPack') {
        const { count, templateType } = item.group;

        if (!acc[templateType]) {

          acc[templateType] = [];
        }
        for (let i = 1; i <= count; i++) {
          acc[templateType].push({
            ...baseEntry,
            id: `${templateType}-${item.id}-vm${i}`,
          });
        }
      } else {
        acc[type].push(baseEntry);
      }

      return acc;
    }, {});

    console.log('Generated Config:', JSON.stringify(configs, null, 2));
  };

  const handleAdvancedChange = (itemId, advanced) => {
    setWhiteboardItems(ws =>
      ws.map(i =>
        i.id === itemId
          ? { ...i, advanced }
          : i
      )
    );
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <Box className="flex flex-col h-screen bg-gray-100">
        <Box className="flex flex-grow">
          {/* Legend + VLAN panel */}
          <Paper elevation={3} className="w-64 p-4 overflow-y-auto">
            <Typography variant="h6" gutterBottom>
              Legend
            </Typography>
            {legendItems.map(li => (
              <LegendItem key={li.id} {...li} />
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

          {/* Board */}
          <Box className="flex flex-col flex-grow">
            <BoardView
              whiteboardItems={whiteboardItems}
              vlans={vlans}
              rolesMap={roles}
              legendItems={legendItems}
              gridSize={GRID_SIZE}
              occupiedCells={occupiedCells}
              onDrop={handleDrop}
              onDeleteItem={handleDeleteItem}
              onRoleToggle={(id, r) =>
                setWhiteboardItems(ws =>
                  ws.map(i =>
                    i.id === id
                      ? {
                        ...i, roles: i.roles.includes(r)
                          ? i.roles.filter(x => x !== r)
                          : [...i.roles, r]
                      }
                      : i
                  )
                )
              }
              onVlanChange={(id, vs) =>
                setWhiteboardItems(ws =>
                  ws.map(i => i.id === id ? { ...i, vlans: vs } : i)
                )
              }
              onGroupChange={(id, grp) =>
                setWhiteboardItems(ws =>
                  ws.map(i => i.id === id ? { ...i, group: grp } : i)
                )
              }
              onAdvancedChange={handleAdvancedChange}
            />
          </Box>
        </Box>

        <FooterActions
          onSaveWork={saveWork}
          onGenerateConfig={generateConfigFiles}
          onClearCache={handleClearCache}
          snackbarOpen={snackbarOpen}
          onCloseSnackbar={() => setSnackbarOpen(false)}
        />
      </Box>
    </DndProvider>
  );
}
