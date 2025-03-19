import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { checkFileExists } from '@/lib/checkFileExists';
import { getTopicSlugPath } from '@/lib/getCoursesStructure';
import path from 'path';

interface MarkdownRendererProps {
    content: string;
    courseSlug: string;
    currentDir: string;
    courseDir: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
                                                               content,
                                                               courseSlug,
                                                               currentDir,
                                                               courseDir,
                                                           }) => {
    const transformWikiLinks = (text: string) => {
        return text.replace(/\[\[(.*?)(?:\|(.*?))?]]/g, (match, linkPath, displayText) => {
            const isAttachment = /\.(pdf|png|jpg|jpeg|gif|svg)$/i.test(linkPath);
            const textToShow = displayText || linkPath;

            if (isAttachment) {
                const rawFileName = linkPath; // Сырой путь из Wiki-ссылки
                const fileName = decodeURIComponent(rawFileName.split('/').pop() || rawFileName); // Только имя файла
                const filePath = checkFileExists(fileName, courseDir, courseDir); // Ищем с корня курса
                console.log('Wiki image:', { match, rawFileName, fileName, filePath, currentDir, courseDir }); // Улучшенная отладка
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
                const filePath = checkFileExists(mdPath, currentDir, courseDir);
                const slugPath = getTopicSlugPath(courseSlug, mdPath);
                const href = filePath && slugPath ? `/${courseSlug}/${slugPath}` : '#';
                return filePath
                    ? `[${textToShow}](${href})`
                    : `<span style="color: red; text-decoration: underline">[${textToShow}](#)</span>`;
            }
        });
    };

    const transformedContent = transformWikiLinks(content);

    return (
        <ReactMarkdown
            components={{
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

                    const isAbsolute = src.includes('/') || src.includes(courseSlug);
                    let filePath: string | null;
                    let fileName = src;

                    if (isAbsolute) {
                        fileName = decodeURIComponent(src.split('/').pop() || src); // Только имя файла
                        filePath = checkFileExists(fileName, courseDir, courseDir); // Ищем с корня курса
                    } else {
                        fileName = decodeURIComponent(src);
                        filePath = checkFileExists(fileName, courseDir, courseDir);
                    }

                    console.log('Image:', { src, fileName, filePath, currentDir, courseDir });

                    const correctedSrc = filePath
                        ? `/api/files/${courseSlug}/${encodeURIComponent(path.relative(courseDir, filePath))}`
                        : '#';
                    return (
                        <img
                            src={correctedSrc}
                            alt={alt || fileName}
                            style={{ maxWidth: '100%' }}
                            {...props}
                        />
                    );
                },
                a({ href, children, ...props }) {
                    if (href && href.endsWith('.md')) {
                        const isAbsolute = href.includes('/') || href.includes(courseSlug);
                        let filePath: string | null;
                        let slugPath: string | null;
                        let fileName = href;

                        if (isAbsolute) {
                            fileName = href.split('/').pop() || href;
                            fileName = decodeURIComponent(fileName);
                            filePath = checkFileExists(fileName, currentDir, courseDir);
                            slugPath = getTopicSlugPath(courseSlug, fileName);
                        } else {
                            fileName = decodeURIComponent(href);
                            filePath = checkFileExists(fileName, currentDir, courseDir);
                            slugPath = getTopicSlugPath(courseSlug, fileName);
                        }

                        const correctedHref = filePath && slugPath ? `/${courseSlug}/${slugPath}` : '#';
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
            }}
        >
            {transformedContent}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;