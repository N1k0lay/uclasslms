import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {getOriginalCourseName} from "@/lib/getCoursesStructure";

interface CourseContent {
    data: { [key: string]: any };
    content: string;
}

console.log('Imported getOriginalCourseName:', typeof getOriginalCourseName);

export function loadCourse(courseSlug: string, filePath: string): CourseContent {
    console.log('loadCourse called with:', { courseSlug, filePath });
    const originalCourse = getOriginalCourseName(courseSlug);
    console.log('getOriginalCourseName result:', originalCourse);
    if (!originalCourse) {
        throw new Error(`Course ${courseSlug} not found`);
    }

    let fullPath = path.join(process.cwd(), 'courses', originalCourse, filePath);
    if (!fullPath.endsWith('.md')) {
        fullPath = `${fullPath}.md`;
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
        throw new Error(`Expected a file but found a directory: ${fullPath}`);
    }

    console.log('Loading file:', { courseSlug, filePath, fullPath });
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { data, content };
}