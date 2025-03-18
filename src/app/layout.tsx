import { getCoursesStructure } from '../lib/getCoursesStructure';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const coursesStructure = getCoursesStructure();

    return (
        <html lang="en">
        <body>
        <div style={{ display: 'flex' }}>
            <Navbar coursesStructure={coursesStructure} />
            <main>{children}</main>
        </div>
        </body>
        </html>
    );
}