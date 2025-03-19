import {NextRequest, NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';
import {getOriginalCourseName} from '@/lib/getCoursesStructure';
import {checkFileExists} from '@/lib/checkFileExists';

// Функция для преобразования Node.js ReadStream в ReadableStream
function toReadableStream(nodeStream: fs.ReadStream): ReadableStream {
    return new ReadableStream({
        start(controller) {
            nodeStream.on('data', (chunk) => {
                controller.enqueue(chunk);
            });
            nodeStream.on('end', () => {
                controller.close();
            });
            nodeStream.on('error', (err) => {
                controller.error(err);
            });
        },
        cancel() {
            nodeStream.destroy();
        },
    });
}

export async function GET(req: NextRequest, {params}: { params: Promise<{ course: string; file: string[] }> }) {
    const {course, file} = await params;

    // Получаем оригинальное имя курса
    const originalCourse = getOriginalCourseName(course);
    if (!originalCourse) {
        return NextResponse.json({error: 'Course not found'}, {status: 404});
    }

    // Формируем путь к файлу из параметров
    const filePathFromParams = decodeURIComponent(file.join('/')); // Декодируем путь (attachments%2F3-1-2.svg → attachments/3-1-2.svg)
    const courseDir = path.join(process.cwd(), 'courses', originalCourse);
    // Используем корень курса как текущую директорию
    // Ищем файл рекурсивно по всему курсу
    const fullFilePath = checkFileExists(filePathFromParams, courseDir, courseDir);
    if (!fullFilePath || !fs.existsSync(fullFilePath)) {
        console.log(`File not found: ${filePathFromParams} in ${courseDir}`);
        return NextResponse.json({error: 'File not found'}, {status: 404});
    }

    // Определяем MIME-тип на основе расширения файла
    const fileExt = path.extname(fullFilePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
    };
    const contentType = mimeTypes[fileExt] || 'application/octet-stream';

    // Читаем файл как поток и преобразуем в ReadableStream
    const fileStream = fs.createReadStream(fullFilePath);
    const readableStream = toReadableStream(fileStream);

    return new NextResponse(readableStream, {
        status: 200,
        headers: {
            'Content-Type': contentType,
        },
    });
}