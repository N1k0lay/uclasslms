export interface Topic {
    slug: string;
    title: string;
    originalFileName: string;
}

export interface Course {
    course: string;
    topics: Topic[];
}

export interface CourseData {
    data: {
        title?: string;
        [key: string]: string | undefined;
    };
    content: string;
}