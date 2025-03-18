import { notFound } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { getTopicFileName } from '@/lib/getCoursesStructure';
import {loadCourse} from "@/lib/loadCourse";

interface TopicPageParams {
    params: Promise<{
        course: string;
        topic: string[];
    }>;
}

export default async function TopicPage({ params }: TopicPageParams) {
    const { course, topic } = await params;

    if (!course || !topic) {
        console.log('Params missing:', { course, topic });
        return <p>Загрузка...</p>;
    }

    let slugPath = topic.join('/');
    if (slugPath.endsWith('/index')) {
        slugPath = slugPath.replace('/index', '');
    }
    console.log('Generated slugPath:', slugPath);

    const originalFileName = getTopicFileName(course, slugPath);
    console.log('Found file:', originalFileName);

    if (!originalFileName) {
        console.log('File not found for:', { course, slugPath });
        notFound();
    }

    const { data, content } = loadCourse(course, originalFileName);

    return (
        <div>
            <h1>{data.title || 'Без названия'}</h1>
            <MarkdownRenderer content={content} course={course} />
        </div>
    );
}