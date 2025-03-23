import { notFound } from 'next/navigation';
import { getTopicFileName, getCoursesStructure } from '@/lib/getCoursesStructure';
import { loadCourse } from '@/lib/loadCourse';
import path from 'path';
import MarkdownRenderer from "@/components/MarkdownRenderer";

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

    let data, content;
    try {
        ({ data, content } = loadCourse(courseSlug, originalFileName));
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
        <div style={{ display: 'flex' }}>
            <div style={{ flexGrow: 1, padding: '20px' }}>
                <h1>{data.title || originalFileName.split('/').pop()?.replace('.md', '') || 'Курс ' + courseSlug}</h1>
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