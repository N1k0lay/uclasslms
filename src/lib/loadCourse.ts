import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface CourseContent {
    data: { [key: string]: string };
    content: string;
}

export function loadCourse(course: string, filePath: string): CourseContent {
    const fullPath = path.join(process.cwd(), 'courses', course, filePath);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { data, content };
}