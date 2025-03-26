import fs from 'fs';
import path from 'path';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkToc from 'remark-toc';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import {visit} from 'unist-util-visit';
import {parse} from 'yaml';
import type { Element, Text } from 'hast'; // Import Hast types

export interface TocItem {
    title: string;
    id: string;
    level: number;
}

export function loadCourse(courseSlug: string, fileName: string) {
    const filePath = path.join(process.cwd(), 'courses', courseSlug, fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    let frontmatter = {};
    let contentStart = 0;

    if (fileContent.startsWith('---\n')) {
        const endIndex = fileContent.indexOf('\n---\n', 3);
        if (endIndex !== -1) {
            const yamlStr = fileContent.slice(4, endIndex).trim();
            try {
                frontmatter = parse(yamlStr);
            } catch (error) {
                console.error('Error parsing YAML:', error);
            }
            contentStart = endIndex + 5;
        }
    }

    const content = fileContent.slice(contentStart).trim();

    const processor = unified()
        .use(remarkParse)
        .use(remarkToc, {heading: 'Оглавление', tight: true})
        .use(remarkRehype)
        .use(rehypeSlug);

    const tree = processor.parse(content);
    const processedTree = processor.runSync(tree);

    const toc: TocItem[] = [];

    visit(processedTree, 'element', (node: Element) => {
        if (/^h[1-6]$/.test(node.tagName)) {
            const textNodes = node.children.filter(
                (child): child is Text => child.type === 'text'
            );
            const text = textNodes.map((child) => child.value).join('');
            const id = (node.properties?.id as string) || text.toLowerCase().replace(/\s+/g, '-');
            const level = parseInt(node.tagName.slice(1), 10);
            toc.push({title: text, id, level});
        }
    });

    return {data: frontmatter, content, toc};
}