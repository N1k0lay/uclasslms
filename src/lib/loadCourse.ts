import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getOriginalCourseName } from './getCoursesStructure';

interface CourseContent {
    data: { [key: string]: any };
    content: string;
}

export function loadCourse(courseSlug: string, filePath: string): CourseContent {
    const originalCourse = getOriginalCourseName(courseSlug);
    if (!originalCourse) {
        throw new Error(`Course ${courseSlug} not found`);
    }
    const fullPath = path.join(process.cwd(), 'courses', originalCourse, filePath);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { data, content };
}