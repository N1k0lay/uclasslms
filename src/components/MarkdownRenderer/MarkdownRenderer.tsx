import React, { ReactNode, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkCallout from '@r4ai/remark-callout';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { checkFileExists } from '@/lib/checkFileExists';
import { getTopicSlugPath } from '@/lib/getCoursesStructure';
import path from 'path';
import fs from 'fs';
import './Callout.css';

// Интерфейсы для пропсов компонентов
interface AnchorProps {
    href?: string;
    children?: ReactNode; // Теперь необязательный
    [key: string]: any;
}

interface ParagraphProps {
    children?: ReactNode; // Теперь необязательный
}

interface CodeProps {
    className?: string;
    children?: ReactNode; // Теперь необязательный
}

interface ImageProps {
    src?: string;
    alt?: string;
    [key: string]: any;
}

interface MarkdownRendererProps {
    content: string;
    courseSlug: string;
    currentDir: string;
    courseDir: string;
}

// Функция для разрешения путей к файлам
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

        return { filePath, fileName };
    } catch (error) {
        console.error('Error resolving file path:', { rawPath, error });
        return { filePath: null, fileName: rawPath };
    }
};

// Основной компонент MarkdownRenderer
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
                                                               content,
                                                               courseSlug,
                                                               currentDir,
                                                               courseDir,
                                                           }) => {
    // Мемоизация функции преобразования вики-ссылок
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

    // Определение кастомных компонентов для ReactMarkdown
    const components: Components = {
        code({ className, children }: CodeProps) {
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
        img({ src, alt, ...props }: ImageProps) {
            if (!src) return <img src="#" alt={alt} {...props} />;
            const isExplicitRelative = src.startsWith('./') || src.startsWith('../');
            const { filePath, fileName } = resolveFilePath(src, currentDir, courseDir, isExplicitRelative);
            const correctedSrc = filePath
                ? `/api/files/${courseSlug}/${encodeURIComponent(path.relative(courseDir, filePath))}`
                : '#';
            return <img src={correctedSrc} alt={alt || fileName} style={{ maxWidth: '100%' }} {...props} />;
        },
        a({ href, children, ...props }: AnchorProps) {
            if (!href) return <a href="#" {...props}>{children}</a>;
            const isMarkdown = href.endsWith('.md');
            const isExplicitRelative = href.startsWith('./') || href.startsWith('../');
            if (isMarkdown) {
                const { filePath, fileName } = resolveFilePath(href, currentDir, courseDir, isExplicitRelative);
                const slugPath = filePath
                    ? getTopicSlugPath(courseSlug, fileName, isExplicitRelative ? currentDir : undefined)
                    : null;
                const correctedHref = filePath ? (slugPath ? `/${courseSlug}/${slugPath}` : `/${courseSlug}`) : '#';
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
        p({ children }: ParagraphProps) {
            const child = Array.isArray(children) ? children[0] : children;
            if (typeof child === 'string' && child.startsWith('Не найден:')) {
                return <p style={{ color: 'red' }}>{child}</p>;
            }
            return <p>{children}</p>;
        },
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkCallout, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={components}
        >
            {transformedContent}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;