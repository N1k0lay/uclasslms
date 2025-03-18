import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ course: string; file: string[] }> }
) {
    const { course, file } = await params;
    const filePath = file.join('/');
    const fullPath = path.join(process.cwd(), 'courses', course, 'attachments', filePath);

    if (!fs.existsSync(fullPath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const fileExt = filePath.split('.').pop()?.toLowerCase();

    const contentTypes: { [key: string]: string } = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
    };

    const contentType = contentTypes[fileExt || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(filePath)}"`,
        },
    });
}