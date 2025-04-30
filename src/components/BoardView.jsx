// src/components/BoardView.jsx
import React from 'react';
import { Box } from '@mui/material';
import Whiteboard from './Whiteboard';
import WhiteboardItem from './WhiteboardItem';
import DeleteArea from './DeleteArea';

export default function BoardView({
    whiteboardItems,
    vlans,
    rolesMap,
    legendItems,
    gridSize,
    occupiedCells,
    onDrop,
    onDeleteItem,
    onRoleToggle,
    onVlanChange,
    onGroupChange,
    onAdvancedChange,
}) {
    // Compute VLAN-group bounding boxes, now including vmPack.group.vlans
    const vlanBounds = vlans
        .map(vlan => {
            // include items whose .vlans or .group.vlans contain this VLAN
            const members = whiteboardItems.filter(i => {
                const hasDirect = i.vlans?.includes(vlan.id);
                const hasGroup = i.group?.vlans?.includes(vlan.id);
                return hasDirect || hasGroup;
            });
            if (members.length === 0) return null;

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
                {/* VLAN-colored dashed frames */}
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

                {/* All items (including vmPacks) */}
                {whiteboardItems.map(item => (
                    <WhiteboardItem
                        key={item.id}
                        item={item}
                        roles={rolesMap[item.id.split('-')[0]] || []}
                        availableVlans={vlans}
                        legendItems={legendItems}
                        onRoleToggle={onRoleToggle}
                        onVlanChange={onVlanChange}
                        onGroupChange={onGroupChange}
                        onContextMenu={e => { e.preventDefault(); onDeleteItem(item.id); }}
                        gridSize={gridSize}
                        onAdvancedChange={onAdvancedChange}
                    />
                ))}

                <DeleteArea onDrop={i => onDeleteItem(i.id)} />
            </Whiteboard>
        </Box>
    );
}
