import { notFound } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { getTopicFileName, getCoursesStructure } from '@/lib/getCoursesStructure';
import { loadCourse } from '@/lib/loadCourse';
import path from 'path';

interface TopicPageParams {
    params: Promise<{
        course: string;
        topic: string[];
    }>;
}

export default async function TopicPage({ params }: TopicPageParams) {
    const { course: courseSlug, topic } = await params;

    if (!courseSlug || !topic) {
        console.log('Params missing:', { courseSlug, topic });
        return <p>Загрузка...</p>;
    }

    let slugPath = topic.join('/');
    if (slugPath.endsWith('/index')) {
        slugPath = slugPath.replace('/index', '');
    }
    console.log('Generated slugPath:', slugPath);

    const originalFileName = getTopicFileName(courseSlug, slugPath);
    console.log('Found file:', originalFileName);

    if (!originalFileName) {
        console.log('File not found for:', { courseSlug, slugPath });
        notFound();
    }

    let data, content;
    try {
        ({ data, content } = loadCourse(courseSlug, originalFileName));
    } catch (error) {
        console.error('Error loading course:', error);
        notFound();
    }

    const coursesStructure = getCoursesStructure();
    const courseData = coursesStructure.find((c) => c.slug === courseSlug);
    if (!courseData) {
        console.error('Course not found for slug:', courseSlug);
        notFound();
    }

    const courseDir = path.join(process.cwd(), 'courses', courseData.originalName);
    const currentDir = path.join(courseDir, path.dirname(originalFileName));

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ flexGrow: 1, padding: '20px' }}>
                <h1>{data.title || originalFileName.split('/').pop()?.replace('.md','')}</h1>
                <MarkdownRenderer
                    content={content}
                    courseSlug={courseSlug}
                    currentDir={currentDir}
                    courseDir={courseDir}
                />
            </div>
        </div>
    );
}