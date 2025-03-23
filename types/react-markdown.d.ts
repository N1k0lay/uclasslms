import { ReactNode } from 'react';
import { Node } from 'unist';

// Интерфейс для узла с hProperties
interface CalloutNode extends Node {
    data?: {
        hName?: string;
        hProperties?: {
            className?: string;
            'data-callout'?: string;
            'data-collapsed'?: string;
        };
    };
}

declare module 'react-markdown' {
    interface Components {
        callout: (props: {
            node: CalloutNode;
            children: ReactNode[];
            className?: string;
        }) => ReactNode;
    }
}