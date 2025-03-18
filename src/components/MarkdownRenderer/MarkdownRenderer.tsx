import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { Language } from 'prism-react-renderer';
import Image from "next/image";


interface MarkdownRendererProps {
    content: string;
    course: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, course }) => {
    const basePath = `/api/files/${course}/attachments`; // Используем API-роут для доступа к файлам

    return (
        <ReactMarkdown
            components={{
                code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;

                    return isInline ? (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    ) : (
                        <SyntaxHighlighter
                            language={match[1] as Language}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    );
                },
                p({ children }) {
                    const child = Array.isArray(children) ? children[0] : children;
                    if (typeof child === 'string') {
                        const obsidianLinkMatch = child.match(/!\[\[(.*?)\]\]/);
                        if (obsidianLinkMatch) {
                            const fileName = obsidianLinkMatch[1];
                            const fileExt = fileName.split('.').pop()?.toLowerCase();
                            const filePath = `${basePath}/${encodeURIComponent(fileName)}`;

                            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
                            if (fileExt && imageExtensions.includes(fileExt)) {
                                return <Image width={500} height={500} src={filePath} loading={'lazy'} alt={fileName} style={{ maxWidth: '100%' }} />;
                            }

                            if (fileExt === 'pdf') {
                                return (
                                    <a href={filePath} target="_blank" rel="noopener noreferrer">
                                        {fileName} (PDF)
                                    </a>
                                );
                            }
                        }
                    }
                    return <p>{children}</p>;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;