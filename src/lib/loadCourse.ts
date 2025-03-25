import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkToc from 'remark-toc';
import remarkGfm from 'remark-gfm';
import remarkCallout from '@r4ai/remark-callout';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';

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

    const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkParseFrontmatter)
        .use(remarkToc, { heading: 'Оглавление', tight: true })
        .use(remarkGfm)
        .use(remarkCallout)
        .use(remarkMath)
        .use(remarkRehype)
        .use(rehypeSlug);

    const tree = processor.parse(fileContent);
    const processedTree = processor.runSync(tree);

    // Извлечение фронтматтера
    const frontmatter = (processedTree.data as any)?.frontmatter || {};

    // Извлечение оглавления
    let toc: TocItem[] = [];
    visit(processedTree, 'element', (node: any) => {
        if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
            const text = node.children
                .filter((child: any) => child.type === 'text')
                .map((child: any) => child.value)
                .join('');
            const id = node.properties?.id || text.toLowerCase().replace(/\s+/g, '-');
            const level = parseInt(node.tagName.slice(1), 10);
            toc.push({ title: text, id, level });
        }
    });

    // Разделение на контент
    const contentStart = fileContent.indexOf('\n---\n', 3) + 5;
    const content = fileContent.slice(contentStart).trim();

    return { data: frontmatter, content, toc };
}