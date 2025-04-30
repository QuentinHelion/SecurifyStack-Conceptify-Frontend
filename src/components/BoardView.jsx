// src/components/BoardView.jsx
import React from 'react';
import { Box } from '@mui/material';
import Whiteboard from './Whiteboard';
import WhiteboardItem from './WhiteboardItem';
import DeleteArea from './DeleteArea';

export default function BoardView({
    whiteboardItems,
    vlans,
    rolesMap,        // renamed for clarity
    gridSize,
    occupiedCells,
    onDrop,
    onDeleteItem,
    onRoleToggle,    // now coming from App
    onVlanChange,    // now coming from App
}) {
    // Recompute the VLAN‐group bounding boxes exactly as before…
    const vlanBounds = vlans
        .map(vlan => {
            const members = whiteboardItems.filter(i => i.vlans.includes(vlan.id));
            if (!members.length) return null;
            const xs = members.map(i => i.left);
            const ys = members.map(i => i.top);
            const size = gridSize;
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
        <Box className="flex flex-col flex-grow">
            <Whiteboard
                onDrop={onDrop}
                gridSize={gridSize}
                occupiedCells={occupiedCells}
                className="flex-grow"
            >
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

                {whiteboardItems.map(item => (
                    <WhiteboardItem
                        key={item.id}
                        item={item}
                        // ← properly pull the roles‐array out of the map
                        roles={rolesMap[item.id.split('-')[0]] || []}
                        availableVlans={vlans}
                        onRoleToggle={onRoleToggle}
                        onVlanChange={onVlanChange}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onDeleteItem(item.id);
                        }}
                        gridSize={gridSize}
                    />
                ))}

                <DeleteArea onDrop={i => onDeleteItem(i.id)} />
            </Whiteboard>
        </Box>
    );
}
