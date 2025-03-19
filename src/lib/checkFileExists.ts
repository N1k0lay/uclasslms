import fs from 'fs';
import path from 'path';

const findFileInCourse = (fileName: string, dir: string): string | null => {
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        console.log(`Scanning dir: ${dir} for ${fileName}`);
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                const found = findFileInCourse(fileName, fullPath);
                if (found) return found;
            } else if (item.name === fileName) {
                console.log(`Found: ${fullPath}`);
                return fullPath;
            }
        }
        return null;
    } catch (error) {
        console.error(`Ошибка при сканировании директории ${dir}:`, error);
        return null;
    }
};

export const checkFileExists = (fileName: string, currentDir: string, courseDir: string): string | null => {
    const relativePath = path.join(currentDir, fileName);
    console.log('Checking:', { fileName, currentDir, courseDir, relativePath });
    if (fs.existsSync(relativePath)) {
        console.log(`Found in currentDir: ${relativePath}`);
        return relativePath;
    }
    return findFileInCourse(fileName, courseDir);
};