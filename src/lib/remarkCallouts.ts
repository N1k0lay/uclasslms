import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';
import { Root, Blockquote, Paragraph } from 'mdast';

const remarkCallouts: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
            const firstChild = node.children[0] as Paragraph;
            if (!firstChild || firstChild.type !== 'paragraph') return;

            const firstText = firstChild.children[0];
            if (!firstText || firstText.type !== 'text') return;

            const match = firstText.value.match(/^\[!(\w+)([+-]?)\](?:\s+(.+))?$/);
            if (!match) return;

            const [_, type, foldable, title] = match;
            const isCollapsed = foldable === '-';
            const calloutTitle = title || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

            const contentNodes = node.children.slice(1);

            const calloutNode = {
                type: 'callout',
                data: {
                    hName: 'div',
                    hProperties: {
                        className: 'callout',
                        'data-callout': type.toLowerCase(),
                        'data-collapsed': isCollapsed.toString(),
                    },
                },
                children: [
                    {
                        type: 'calloutTitle',
                        data: {
                            hName: 'div',
                            hProperties: { className: 'callout-title' },
                        },
                        children: [{ type: 'text', value: calloutTitle }],
                    },
                    {
                        type: 'calloutContent',
                        data: {
                            hName: 'div',
                            hProperties: { className: 'callout-content' },
                        },
                        children: contentNodes,
                    },
                ],
            };

            console.log('remarkCallouts created node:', JSON.stringify(calloutNode, null, 2)); // Отладка

            if (parent && index !== undefined) {
                parent.children[index] = calloutNode as any;
            }
        });
    };
};

export default remarkCallouts;