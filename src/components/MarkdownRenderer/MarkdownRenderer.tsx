import React, { useMemo, ReactNode, isValidElement, ReactElement } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkCallouts from '@/lib/remarkCallouts';
import Callout from '@/components/Callout';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { checkFileExists } from '@/lib/checkFileExists';
import { getTopicSlugPath } from '@/lib/getCoursesStructure';
import path from 'path';
import fs from 'fs';
import { Node } from 'unist';

// Интерфейс для props элементов callout
interface CalloutElementProps {
    className?: string;
    children?: ReactNode;
}

interface MarkdownRendererProps {
    content: string;
    courseSlug: string;
    currentDir: string;
    courseDir: string;
}

const resolveFilePath = (
    rawPath: string,
    currentDir: string,
    courseDir: string,
    isExplicitRelative: boolean = false
): { filePath: string | null; fileName: string } => {
    try {
        let fileName = decodeURIComponent(rawPath);
        let filePath: string | null = null;

        if (isExplicitRelative) {
            fileName = fileName.replace(/^\.\//, '').replace(/^\.\.\//, '');
            const resolvedPath = path.resolve(currentDir, fileName);
            console.log('Explicit relative path:', { rawPath, fileName, resolvedPath, currentDir });
            if (fs.existsSync(resolvedPath)) {
                filePath = resolvedPath;
            }
        } else {
            if (currentDir === courseDir && fileName === 'index.md') {
                const indexPath = path.join(courseDir, 'index.md');
                if (fs.existsSync(indexPath)) {
                    filePath = indexPath;
                }
            } else {
                filePath = checkFileExists(fileName, currentDir, courseDir);
            }
        }

        console.log('Resolved:', { rawPath, fileName, filePath });
        return { filePath, fileName };
    } catch (error) {
        console.error('Error resolving file path:', { rawPath, error });
        return { filePath: null, fileName: rawPath };
    }
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
                                                               content,
                                                               courseSlug,
                                                               currentDir,
                                                               courseDir,
                                                           }) => {
    const transformWikiLinks = useMemo(() => {
        return (text: string): string => {
            return text.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, linkPath, displayText) => {
                const isAttachment = /\.(pdf|png|jpg|jpeg|gif|svg)$/i.test(linkPath);
                const textToShow = displayText || linkPath;

                if (isAttachment) {
                    const { filePath, fileName } = resolveFilePath(linkPath, currentDir, courseDir);
                    if (filePath) {
                        const fileExt = fileName.split('.').pop()?.toLowerCase();
                        const relativePath = path.relative(courseDir, filePath);
                        const fileUrl = `/api/files/${courseSlug}/${encodeURIComponent(relativePath)}`;
                        if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(fileExt || '')) {
                            return `![${textToShow}](${fileUrl})`;
                        } else if (fileExt === 'pdf') {
                            return `[${textToShow}](${fileUrl})`;
                        }
                    }
                    return `Не найден: ${linkPath}`;
                } else {
                    const mdPath = linkPath.endsWith('.md') ? linkPath : `${linkPath}.md`;
                    const { filePath, fileName } = resolveFilePath(mdPath, currentDir, courseDir);
                    const slugPath = filePath
                        ? getTopicSlugPath(courseSlug, fileName, currentDir === courseDir ? courseDir : currentDir)
                        : null;
                    const href = filePath ? (slugPath ? `/${courseSlug}/${slugPath}` : `/${courseSlug}`) : '#';
                    return filePath
                        ? `[${textToShow}](${href})`
                        : `<span style="color: red; text-decoration: underline">[${textToShow}](#)</span>`;
                }
            });
        };
    }, [courseSlug, currentDir, courseDir]);

    const transformedContent = transformWikiLinks(content);

    const components: Components = {
        code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
                <code className={className}>{children}</code>
            ) : (
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]}>
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            );
        },
        img({ src, alt, ...props }) {
            if (!src) return <img src="#" alt={alt} {...props} />;
            const isExplicitRelative = src.startsWith('./') || src.startsWith('../');
            const { filePath, fileName } = resolveFilePath(src, currentDir, courseDir, isExplicitRelative);
            const correctedSrc = filePath
                ? `/api/files/${courseSlug}/${encodeURIComponent(path.relative(courseDir, filePath))}`
                : '#';
            return <img src={correctedSrc} alt={alt || fileName} style={{ maxWidth: '100%' }} {...props} />;
        },
        a({ href, children, ...props }) {
            if (!href) return <a href="#" {...props}>{children}</a>;
            const isMarkdown = href.endsWith('.md');
            const isExplicitRelative = href.startsWith('./') || href.startsWith('../');
            if (isMarkdown) {
                const { filePath, fileName } = resolveFilePath(href, currentDir, courseDir, isExplicitRelative);
                const slugPath = filePath
                    ? getTopicSlugPath(courseSlug, fileName, isExplicitRelative ? currentDir : undefined)
                    : null;
                const correctedHref = filePath ? (slugPath ? `/${courseSlug}/${slugPath}` : `/${courseSlug}`) : '#';
                console.log('Link:', { href, fileName, filePath, slugPath, correctedHref });
                return (
                    <a
                        href={correctedHref}
                        style={filePath ? {} : { color: 'red', textDecoration: 'underline' }}
                        {...props}
                    >
                        {children}
                    </a>
                );
            }
            return <a href={href} {...props}>{children}</a>;
        },
        p({ children }) {
            const child = Array.isArray(children) ? children[0] : children;
            if (typeof child === 'string' && child.startsWith('Не найден:')) {
                return <p style={{ color: 'red' }}>{child}</p>;
            }
            return <p>{children}</p>;
        },
        // @ts-ignore
        callout: ({ node, children }: { node: Node; children: ReactNode[] }) => {
            const hProperties = (node.data as { hProperties?: { [key: string]: string } })?.hProperties || {};
            const type = hProperties['data-callout'] || 'note';
            const collapsed = hProperties['data-collapsed'] === 'true';

            // Явно указываем тип для child как ReactElement<CalloutElementProps>
            const titleNode = children.find(
                (child): child is ReactElement<CalloutElementProps> =>
                    isValidElement<CalloutElementProps>(child) && child.props.className === 'callout-title'
            );
            const contentNode = children.find(
                (child): child is ReactElement<CalloutElementProps> =>
                    isValidElement<CalloutElementProps>(child) && child.props.className === 'callout-content'
            );

            return (
                <Callout
                    type={type}
                    title={titleNode?.props.children || type}
                    collapsed={collapsed}
                >
                    {contentNode?.props.children || null}
                </Callout>
            );
        },
    };

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkCallouts]} components={components}>
            {transformedContent}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;