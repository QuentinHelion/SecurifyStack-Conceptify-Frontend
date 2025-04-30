// src/components/VlanPanel.jsx
import React from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function VlanPanel({
    vlans,
    newVlanId,
    setNewVlanId,
    newVlanName,
    setNewVlanName,
    newVlanColor,
    setNewVlanColor,
    onAddVlan,
    onColorChange,
}) {
    return (
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
                <IconButton size="small" onClick={onAddVlan}>
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
                        onChange={e => onColorChange(vlan.id, e.target.value)}
                        style={{
                            marginLeft: 'auto',
                            width: 24,
                            height: 24,
                            border: 'none',
                            padding: 0,
                        }}
                    />
                </Box>
            ))}
        </Box>
    );
}
