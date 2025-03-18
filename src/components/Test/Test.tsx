import React, { useState } from 'react';

interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
}

interface TestProps {
    questions: Question[];
}

const Test: React.FC<TestProps> = ({ questions }) => {
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [score, setScore] = useState<number | null>(null);

    const handleAnswer = (questionIndex: number, answer: string) => {
        setAnswers({ ...answers, [questionIndex]: answer });
    };

    const submitTest = () => {
        let correct = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) correct++;
        });
        setScore(correct);
    };

    return (
        <div>
            {questions.map((q, index) => (
                <div key={index}>
                    <p>{q.question}</p>
                    {q.options.map((option, optIndex) => (
                        <label key={optIndex}>
                            <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                onChange={() => handleAnswer(index, option)}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            ))}
            <button onClick={submitTest}>Завершить тест</button>
            {score !== null && <p>Ваш результат: {score}/{questions.length}</p>}
        </div>
    );
};

export default Test;