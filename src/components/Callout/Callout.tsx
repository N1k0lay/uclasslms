'use client';

import React, { useState } from 'react';
import styles from './Callout.module.css';

interface CalloutProps {
    type: string;
    title: React.ReactNode;
    collapsed: boolean;
    children: React.ReactNode;
}

const Callout: React.FC<CalloutProps> = ({ type, title, collapsed, children }) => {
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    console.log('Callout.tsx rendered:', { type, title, collapsed, children });

    return (
        <div className={styles.callout} data-callout={type.toLowerCase()}>
            <div
                className={styles.calloutTitle}
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5em' }}
            >
                {title} {isCollapsed ? '▶' : '▼'} (TEST TEXT)
            </div>
            <div className={styles.calloutContent} style={{ display: isCollapsed ? 'none' : 'block' }}>
                {children}
            </div>
        </div>
    );
};

export default Callout;