import fs from 'fs';
import path from 'path';

const searchUpwards = (fileName: string, startDir: string, rootDir: string): string | null => {
    let currentDir = startDir;
    while (currentDir.startsWith(rootDir)) {
        const fullPath = path.join(currentDir, fileName);
        //console.log(`Searching upwards: ${fullPath}`);
        if (fs.existsSync(fullPath)) {
            //console.log(`Found upwards: ${fullPath}`);
            return fullPath;
        }
        currentDir = path.dirname(currentDir);
        if (currentDir === rootDir) break; // Дошли до корня курса
    }
    //console.log(`Not found upwards for ${fileName} in ${rootDir}`);
    return null;
};

export const checkFileExists = (fileName: string, currentDir: string, courseDir: string): string | null => {
    // Сначала проверяем в currentDir
    const relativePath = path.join(currentDir, fileName);
    //console.log('Checking currentDir:', { fileName, currentDir, relativePath });
    if (fs.existsSync(relativePath)) {
        //console.log(`Found in currentDir: ${relativePath}`);
        return relativePath;
    }

    // Ищем вверх по директориям до courseDir
    return searchUpwards(fileName, currentDir, courseDir);
};