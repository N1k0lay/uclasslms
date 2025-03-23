import React from 'react';
import { Course } from '@/lib/getCoursesStructure';
import ClientNavbar from "@/components/Navbar/ClientNavbar";

interface NavbarProps {
    coursesStructure: Course[];
}

export default function Navbar({ coursesStructure }: NavbarProps) {
    return (
        <nav style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', maxWidth: '300px' }}>
            <ClientNavbar coursesStructure={coursesStructure} />
        </nav>
    );
}