'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Course, Topic } from '@/lib/getCoursesStructure';

interface ClientNavbarProps {
    coursesStructure: Course[];
}

interface TopicItemProps {
    courseSlug: string;
    topic: Topic;
    isOpen: boolean;
    toggleOpen: (slugPath: string) => void;
}

const TopicItem: React.FC<TopicItemProps> = ({ courseSlug, topic, isOpen, toggleOpen }) => {
    const linkPath = `/${courseSlug}/${topic.slugPath}`;

    const handleClick = (e: React.MouseEvent) => {
        if (topic.isFolder) {
            toggleOpen(topic.slugPath);
        }
    };

    return (
        <li>
            {topic.isFolder ? (
                <div>
          <span onClick={handleClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {isOpen ? '▼' : '▶'}
              {topic.hasIndex ? (
                  <Link href={linkPath} style={{ marginLeft: '8px' }}>
                      {topic.title}
                  </Link>
              ) : (
                  <span style={{ marginLeft: '8px' }}>{topic.title}</span>
              )}
          </span>
                    {topic.subTopics && topic.subTopics.length > 0 && isOpen && (
                        <ul style={{ marginLeft: '20px' }}>
                            {topic.subTopics.map((subTopic) => (
                                <TopicItem
                                    key={subTopic.slugPath}
                                    courseSlug={courseSlug}
                                    topic={subTopic}
                                    isOpen={isOpen}
                                    toggleOpen={toggleOpen}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <Link href={linkPath} style={{ display: 'block', padding: '4px 0' }}>
                    {topic.title}
                </Link>
            )}
        </li>
    );
};

const ClientNavbar: React.FC<ClientNavbarProps> = ({ coursesStructure }) => {
    const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

    const toggleOpen = (slug: string) => {
        setOpenStates((prev) => ({
            ...prev,
            [slug]: !prev[slug],
        }));
    };

    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {coursesStructure.map((course) => {
                const courseLink = `/${course.slug}${course.hasIndex ? '' : ''}`;
                const isCourseOpen = openStates[course.slug] || false;

                return (
                    <li key={course.slug}>
            <span
                onClick={() => toggleOpen(course.slug)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '8px' }}
            >
              {isCourseOpen ? '▼' : '▶'}
                {course.hasIndex ? (
                    <Link href={courseLink} style={{ marginLeft: '8px', fontSize: '1.2em', color: '#333' }}>
                        {course.title}
                    </Link>
                ) : (
                    <strong style={{ marginLeft: '8px', fontSize: '1.2em', color: '#333' }}>{course.title}</strong>
                )}
            </span>
                        {isCourseOpen && (
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {course.topics.map((topic) => (
                                    <TopicItem
                                        key={topic.slugPath}
                                        courseSlug={course.slug}
                                        topic={topic}
                                        isOpen={openStates[topic.slugPath] || false}
                                        toggleOpen={toggleOpen}
                                    />
                                ))}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default ClientNavbar;