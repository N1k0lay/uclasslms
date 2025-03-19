'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Topic {
    slug: string;
    title: string;
    slugPath: string;
    isFolder: boolean;
    hasIndex?: boolean;
    subTopics?: Topic[];
}

interface Course {
    slug: string;
    originalName: string;
    topics: Topic[];
}

interface TopicItemProps {
    courseSlug: string;
    topic: Topic;
}

const TopicItem: React.FC<TopicItemProps> = ({ courseSlug, topic }) => {
    const [isOpen, setIsOpen] = useState(false);
    const linkPath = `/${courseSlug}/${topic.slugPath}`;

    const handleClick = (e: React.MouseEvent) => {
        if (topic.isFolder) {
            e.preventDefault();
            if (topic.hasIndex) return;
            setIsOpen(!isOpen);
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
                                <TopicItem key={subTopic.slug} courseSlug={courseSlug} topic={subTopic} />
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

interface NavbarProps {
    coursesStructure: Course[];
}

const Navbar: React.FC<NavbarProps> = ({ coursesStructure }) => {
    return (
        <nav style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', maxWidth: '300px' }}>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {coursesStructure.map((course) => (
                    <li key={course.slug}>
                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1.2em', color: '#333' }}>
                            {course.originalName}
                        </strong>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {course.topics.map((topic) => (
                                <TopicItem key={topic.slug} courseSlug={course.slug} topic={topic} />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;