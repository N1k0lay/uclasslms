import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {transliterate} from 'transliteration';
import {createHash} from 'crypto';

interface Cache {
    structure: Course[];
    lastModified: number;
    fileHash: string;
}

let courseCache: Cache | null = null;

function normalizeSlug(slug: string): string {
    return transliterate(slug)
        .replace(/\+/g, '-plus-')
        .replace(/\./g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '')
        .toLowerCase();
}

export interface Topic {
    slug: string;
    title: string;
    originalFileName: string;
    fullPath: string;
    slugPath: string;
    isFolder: boolean;
    hasIndex?: boolean;
    subTopics?: Topic[];
}

export interface Course {
    slug: string;
    originalName: string;
    title: string;
    hasIndex: boolean;
    topics: Topic[];
}

function hasMarkdownFiles(dirPath: string): boolean {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
            if (hasMarkdownFiles(fullPath)) {
                return true;
            }
        } else if (item.name.endsWith('.md')) {
            return true;
        }
    }
    return false;
}

function scanDirectory(dirPath: string, basePath: string = '', slugBase: string = ''): Topic[] {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const topics: Topic[] = [];
    const slugSet = new Set<string>();

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        const relativePath = path.join(basePath, item.name);
        const slug = normalizeSlug(item.name.replace('.md', ''));
        let slugPath = slugBase ? `${slugBase}/${slug}` : slug;

        if (slugSet.has(slugPath)) {
            const isFile = item.name.endsWith('.md');
            slugPath = `${slugPath}${isFile ? '-file' : '-folder'}`;
            // console.warn(`Duplicate slugPath detected, adjusted to: ${slugPath}`);
        }
        slugSet.add(slugPath);

        if (item.isDirectory()) {
            if (!hasMarkdownFiles(fullPath)) {
                // console.log(`Skipping folder without .md files: ${relativePath}`);
                continue;
            }

            const subTopics = scanDirectory(fullPath, relativePath, slugPath);
            const hasIndex = fs.existsSync(path.join(fullPath, 'index.md'));
            let title = item.name;
            if (hasIndex) {
                const indexPath = path.join(fullPath, 'index.md');
                try {
                    const fileContents = fs.readFileSync(indexPath, 'utf8');
                    const { data } = matter(fileContents);
                    title = data.title || item.name;
                } catch (error) {
                    console.error(`Error parsing frontmatter in ${indexPath}:`, error);
                    title = item.name;
                }
            }
            topics.push({
                slug,
                title,
                originalFileName: item.name,
                fullPath: relativePath,
                slugPath,
                isFolder: true,
                hasIndex,
                subTopics,
            });
        } else if (item.name.endsWith('.md')) {
            try {
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
            } catch (error) {
                console.error(`Error parsing frontmatter in ${fullPath}:`, error);
                topics.push({
                    slug,
                    title: item.name.replace('.md', ''),
                    originalFileName: item.name,
                    fullPath: relativePath,
                    slugPath,
                    isFolder: false,
                });
            }
        }
    }

    return topics;
}

function getDirectoryHash(dir: string): string {
    const fileList: string[] = [];

    function scanDir(currentDir: string, base: string = '') {
        const subItems = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const item of subItems) {
            const relativePath = path.join(base, item.name);
            if (item.isDirectory()) {
                scanDir(path.join(currentDir, item.name), relativePath);
            } else {
                fileList.push(relativePath);
            }
        }
    }

    scanDir(dir);
    fileList.sort();
    return createHash('md5').update(fileList.join('')).digest('hex');
}

function getLastModifiedTime(dir: string): number {
    let latestMtime = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const stats = fs.statSync(fullPath);
        const mtime = stats.mtimeMs;

        if (item.isDirectory()) {
            const subDirMtime = getLastModifiedTime(fullPath);
            latestMtime = Math.max(latestMtime, subDirMtime);
        } else {
            latestMtime = Math.max(latestMtime, mtime);
        }
    }

    return latestMtime;
}

export function getCoursesStructure(): Course[] {
    const coursesDir = path.join(process.cwd(), 'courses');
    const currentLastModified = getLastModifiedTime(coursesDir);
    const currentFileHash = getDirectoryHash(coursesDir);

    if (
        courseCache &&
        courseCache.lastModified >= currentLastModified &&
        courseCache.fileHash === currentFileHash
    ) {
        // console.log('Returning cached structure');
        return courseCache.structure;
    }

    // console.log('Updating course structure cache');
    const courses = fs.readdirSync(coursesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    const structure = courses.map((course) => {
        const courseDir = path.join(coursesDir, course);
        const topics = scanDirectory(courseDir);
        const hasIndex = fs.existsSync(path.join(courseDir, 'index.md'));
        let title = course;
        if (hasIndex) {
            const indexPath = path.join(courseDir, 'index.md');
            try {
                const fileContents = fs.readFileSync(indexPath, 'utf8');
                const { data } = matter(fileContents);
                title = data.title || course;
            } catch (error) {
                console.error(`Error parsing frontmatter in ${indexPath}:`, error);
                title = course;
            }
        }
        return {
            slug: normalizeSlug(course),
            originalName: course,
            title,
            hasIndex,
            topics,
        };
    });

    courseCache = {
        structure,
        lastModified: currentLastModified,
        fileHash: currentFileHash,
    };

    return structure;
}

export function getTopicFileName(courseSlug: string, slugPath: string): string | null {
    const structure = getCoursesStructure();
    const courseData = structure.find((c) => c.slug === courseSlug);
    if (!courseData) return null;

    const decodedSlugPath = decodeURIComponent(slugPath);

    if (!decodedSlugPath && courseData.hasIndex) {
        return 'index.md';
    }

    function findTopic(topics: Topic[]): Topic | undefined {
        for (const topic of topics) {
            if (topic.slugPath === decodedSlugPath) {
                if (topic.isFolder && topic.hasIndex) {
                    return {
                        ...topic,
                        fullPath: path.join(topic.fullPath, 'index.md'),
                        originalFileName: 'index.md',
                        isFolder: false,
                    };
                }
                return topic;
            }
            if (topic.subTopics) {
                const found = findTopic(topic.subTopics);
                if (found) return found;
            }
        }
    }

    const topic = findTopic(courseData.topics);
    // console.log('getTopicFileName:', { courseSlug, slugPath, decodedSlugPath, topic });
    return topic ? topic.fullPath : null;
}

export function getOriginalCourseName(courseSlug: string): string | null {
    const structure = getCoursesStructure();
    const courseData = structure.find((c) => c.slug === courseSlug);
    return courseData ? courseData.originalName : null;
}

export function getTopicSlugPath(courseSlug: string, fileName: string, currentDir?: string): string | null {
    const structure = getCoursesStructure();
    const courseData = structure.find((c) => c.slug === courseSlug);
    if (!courseData) return null;

    function findTopicByFileName(topics: Topic[], targetDir?: string): Topic | undefined {
        for (const topic of topics) {
            if (targetDir) {
                const topicFullPath = path.dirname(topic.fullPath) === '.' ? topic.fullPath : path.dirname(topic.fullPath);
                if (topic.originalFileName === fileName && topicFullPath === targetDir) {
                    return topic;
                }
            } else if (topic.originalFileName === fileName) {
                return topic;
            }
            if (topic.subTopics) {
                const found = findTopicByFileName(topic.subTopics, targetDir);
                if (found) return found;
            }
        }
    }

    const relativeCurrentDir = currentDir ? path.relative(path.join(process.cwd(), 'courses', courseSlug), currentDir) : undefined;
    const topic = findTopicByFileName(courseData.topics, relativeCurrentDir);
    // console.log('getTopicSlugPath:', { courseSlug, fileName, currentDir, relativeCurrentDir, topic });
    return topic ? topic.slugPath : null;
}