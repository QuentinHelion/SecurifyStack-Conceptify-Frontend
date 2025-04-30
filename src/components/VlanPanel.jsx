// src/components/VlanPanel.jsx
import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
} from '@mui/material';
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
    const [idError, setIdError] = useState('');
    const [nameError, setNameError] = useState('');
    const [colorError, setColorError] = useState('');
    const MAX_NAME_LEN = 20;

    const handleAdd = () => {
        let ok = true;
        const trimmedName = newVlanName.trim();
        const idNum = parseInt(newVlanId, 10);

        // ID validation
        if (!newVlanId) {
            setIdError('ID is required');
            ok = false;
        } else if (isNaN(idNum)) {
            setIdError('Must be a number');
            ok = false;
        } else if (vlans.some(v => v.id === idNum)) {
            setIdError('That ID already exists');
            ok = false;
        } else {
            setIdError('');
        }

        // Name validation
        if (!trimmedName) {
            setNameError('Name is required');
            ok = false;
        } else if (trimmedName.length > MAX_NAME_LEN) {
            setNameError(`Max ${MAX_NAME_LEN} characters`);
            ok = false;
        } else if (vlans.some(v => v.name.toLowerCase() === trimmedName.toLowerCase())) {
            setNameError('That name already exists');
            ok = false;
        } else {
            setNameError('');
        }

        // Color validation
        if (vlans.some(v => v.color.toLowerCase() === newVlanColor.toLowerCase())) {
            setColorError('That color is already in use');
            ok = false;
        } else {
            setColorError('');
        }

        if (!ok) return;
        onAddVlan();
    };

    return (
        <Box mt={4}>
            <Typography variant="h6" gutterBottom>
                VLANs
            </Typography>

            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TextField
                    label="ID"
                    type="number"
                    size="small"
                    value={newVlanId}
                    onChange={e => setNewVlanId(e.target.value)}
                    error={!!idError}
                    helperText={idError}
                />

                <TextField
                    label="Name"
                    size="small"
                    value={newVlanName}
                    onChange={e => setNewVlanName(e.target.value)}
                    error={!!nameError}
                    helperText={nameError}
                    inputProps={{ maxLength: MAX_NAME_LEN }}
                />

                <Box>
                    <input
                        type="color"
                        value={newVlanColor}
                        onChange={e => setNewVlanColor(e.target.value)}
                        style={{
                            width: 36,
                            height: 36,
                            border: colorError ? '2px solid red' : 'none',
                            padding: 0,
                        }}
                    />
                    {colorError && (
                        <Typography variant="caption" color="error">
                            {colorError}
                        </Typography>
                    )}
                </Box>

                <IconButton size="small" onClick={handleAdd}>
                    <AddIcon />
                </IconButton>
            </Box>

            {vlans.map(vlan => (
                <Box key={vlan.id} display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                        width={16}
                        height={16}
                        borderRadius="50%"
                        bgcolor={vlan.color}
                    />
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
