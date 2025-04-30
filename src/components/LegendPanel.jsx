// src/components/LegendPanel.jsx
import React from 'react';
import LegendItem from './LegendItem';

export default function LegendPanel({ legendItems }) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Legend</h2>
            {legendItems.map(item => (
                <LegendItem key={item.id} {...item} />
            ))}
        </div>
    );
}
