import { notFound } from 'next/navigation';
import { getTopicFileName, getCoursesStructure } from '@/lib/getCoursesStructure';
import { loadCourse, TocItem } from '@/lib/loadCourse';
import path from 'path';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// Компонент для рендеринга сайдбара
function TocSidebar({ toc }: { toc: TocItem[] }) {
    return (
        <div style={{ width: '30%', padding: '20px', position: 'sticky', top: '20px', height: 'fit-content' }}>
            <h2>Оглавление</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {toc.map((item) => (
                    <li
                        key={item.id}
                        style={{
                            marginLeft: `${(item.level - 1) * 20}px`,
                            marginBottom: '10px',
                        }}
                    >
                        <a href={`#${item.id}`} style={{ textDecoration: 'none', color: '#0070f3' }}>
                            {item.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface CoursePageParams {
    params: Promise<{
        course: string;
        topic?: string[];
    }>;
}

export default async function CoursePage({ params }: CoursePageParams) {
    const { course: courseSlug, topic } = await params;

    if (!courseSlug) {
        console.log('Course slug missing:', { courseSlug });
        return <p>Загрузка...</p>;
    }

    const coursesStructure = getCoursesStructure();
    const isApiRoute = courseSlug === 'api' && !coursesStructure.some((c) => c.slug === 'api');
    if (isApiRoute) {
        console.log('API route detected, skipping page rendering:', { courseSlug, topic });
        notFound();
    }

    const slugPath = topic && topic.length > 0 ? topic.join('/') : '';
    console.log('Generated slugPath:', slugPath);

    const cleanedSlugPath = slugPath.endsWith('/index') ? slugPath.replace('/index', '') : slugPath;

    const originalFileName = getTopicFileName(courseSlug, cleanedSlugPath);
    console.log('Found file:', originalFileName);

    if (!originalFileName) {
        console.log('File not found for:', { courseSlug, slugPath: cleanedSlugPath });
        notFound();
    }

    let data, content, toc;
    try {
        ({ data, content, toc } = loadCourse(courseSlug, originalFileName));
    } catch (error) {
        console.error('Error loading course:', error);
        notFound();
    }

    const courseData = coursesStructure.find((c) => c.slug === courseSlug);
    if (!courseData) {
        console.error('Course not found for slug:', courseSlug);
        notFound();
    }

    const courseDir = path.join(process.cwd(), 'courses', courseData.originalName);
    const currentDir = path.join(courseDir, path.dirname(originalFileName));
    return (
        <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Основной контент */}
            <div style={{ flexGrow: 1, padding: '20px', maxWidth: '70%' }}>
                <h1>{data.title || originalFileName.split('/').pop()?.replace('.md', '') || 'Курс ' + courseSlug}</h1>
                {Object.keys(data).length > 0 && (
                    <div style={{ marginBottom: '20px', color: '#666' }}>
                        {data.date && <p><strong>Дата:</strong> {data.date}</p>}
                        {data.author && <p><strong>Автор:</strong> {data.author}</p>}
                    </div>
                )}
                <MarkdownRenderer
                    content={content}
                    courseSlug={courseSlug}
                    currentDir={currentDir}
                    courseDir={courseDir}
                />
            </div>

            {/* Сайдбар с оглавлением */}
            {toc.length > 0 && <TocSidebar toc={toc} />}
        </div>
    );
}