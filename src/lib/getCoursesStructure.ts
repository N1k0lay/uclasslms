import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { transliterate } from 'transliteration';

interface Topic {
    slug: string;
    title: string;
    originalFileName: string;
    fullPath: string;
    slugPath: string;
    isFolder: boolean; // Признак, что это папка
    hasIndex?: boolean; // Есть ли index.md
    subTopics?: Topic[];
}

interface Course {
    course: string;
    topics: Topic[];
}

function scanDirectory(dirPath: string, basePath: string = '', slugBase: string = ''): Topic[] {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const topics: Topic[] = [];

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        const relativePath = path.join(basePath, item.name);
        const slug = transliterate(item.name.replace('.md', '')).toLowerCase().replace(/\s+/g, '-');
        const slugPath = slugBase ? `${slugBase}/${slug}` : slug;

        if (item.isDirectory()) {
            const subTopics = scanDirectory(fullPath, relativePath, slugPath);
            const hasIndex = fs.existsSync(path.join(fullPath, 'index.md'));
            topics.push({
                slug,
                title: item.name,
                originalFileName: item.name,
                fullPath: relativePath,
                slugPath,
                isFolder: true,
                hasIndex,
                subTopics,
            });
        } else if (item.name.endsWith('.md')) {
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data } = matter(fileContents);
            topics.push({
                slug,
                title: data.title || item.name.replace('.md', ''),
                originalFileName: item.name,
                fullPath: relativePath,
                slugPath,
                isFolder: false,
            });
        }
    }

    return topics;
}

export function getCoursesStructure(): Course[] {
    const coursesDir = path.join(process.cwd(), 'courses');
    const courses = fs.readdirSync(coursesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    return courses.map((course) => {
        const courseDir = path.join(coursesDir, course);
        const topics = scanDirectory(courseDir);
        return { course, topics };
    });
}

export function getTopicFileName(course: string, slugPath: string): string | null {
    const structure = getCoursesStructure();
    const courseData = structure.find((c) => c.course === course);
    if (!courseData) return null;

    const decodedSlugPath = decodeURIComponent(slugPath);

    function findTopic(topics: Topic[]): Topic | undefined {
        for (const topic of topics) {
            if (topic.slugPath === decodedSlugPath) {
                return topic;
            }
            if (topic.isFolder && topic.hasIndex && topic.slugPath === decodedSlugPath) {
                return {
                    ...topic,
                    fullPath: path.join(topic.fullPath, 'index.md'),
                    originalFileName: 'index.md',
                    isFolder: false,
                };
            }
            if (topic.subTopics) {
                const found = findTopic(topic.subTopics);
                if (found) return found;
            }
        }
    }

    const topic = findTopic(courseData.topics);
    return topic ? topic.fullPath : null;
}