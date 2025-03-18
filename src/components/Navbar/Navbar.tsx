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
    course: string;
    topics: Topic[];
}

interface TopicItemProps {
    course: string;
    topic: Topic;
}

const TopicItem: React.FC<TopicItemProps> = ({ course, topic }) => {
    const [isOpen, setIsOpen] = useState(false);
    const linkPath = `/${course}/${topic.slugPath}`;

    const handleClick = (e: React.MouseEvent) => {
        if (topic.isFolder) {
            e.preventDefault();
            if (topic.hasIndex) {
                return;
            }
            setIsOpen(!isOpen);
        }
    };

    return (
        <li>
            {topic.isFolder ? (
                <div>
          <span
              onClick={handleClick}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
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
                                <TopicItem key={subTopic.slug} course={course} topic={subTopic} />
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
        <nav
            style={{
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                maxWidth: '300px',
            }}
        >
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {coursesStructure.map((courseItem) => (
                    <li key={courseItem.course}>
                        <strong
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '1.2em',
                                color: '#333',
                            }}
                        >
                            {courseItem.course}
                        </strong>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {courseItem.topics.map((topic) => (
                                <TopicItem key={topic.slug} course={courseItem.course} topic={topic} />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;