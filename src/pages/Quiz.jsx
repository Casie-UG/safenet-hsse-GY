import React, { useState } from 'react';
import { supabase } from "../supabaseClient";

const KnowledgeBase = () => {
  const answers = {
    q1: 'B',
    q2: 'B',
    q3: 'B',
    q4: 'B',
    q5: 'B',
    q6: 'B',
    q7: 'B',
    q8: 'C'
  };

  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const questions = [
    {
      id: 'q1',
      question: 'What does PPE stand for?',
      options: [
        'Personal Protection Equipment',
        'Personal Protective Equipment',
        'Professional Protective Equipment',
        'Public Protection Equipment'
      ]
    },
    {
      id: 'q2',
      question: 'Which of these is the correct primary step in a fire emergency?',
      options: [
        'Gather personal belongings',
        'Sound the alarm and evacuate',
        'Call your supervisor only',
        'Try to extinguish the fire yourself'
      ]
    },
    {
      id: 'q3',
      question: 'A Material Safety Data Sheet (MSDS) provides information about:',
      options: [
        'The manufacturing process of a chemical',
        'Chemical hazards, handling, and emergency measures',
        'Employee salaries in chemical plants',
        'How to dispose of household waste'
      ]
    },
    {
      id: 'q4',
      question: 'Which keyword would you include in a monitoring script to catch gas-related incidents?',
      options: ['spill', 'gas leak', 'fire drill', 'noise']
    },
    {
      id: 'q5',
      question: 'Before working on energized electrical equipment, you must:',
      options: [
        'Wear steel-toe boots only',
        'Lockout/tagout the energy source',
        'Spray water to cool the equipment',
        'Ensure it’s raining (to ground the system)'
      ]
    },
    {
      id: 'q6',
      question: 'In HSSE reporting, the “severity” of an incident typically describes:',
      options: [
        'How early in the day it occurred',
        'The level of harm or potential harm involved',
        'The number of people who reported it',
        'The weather conditions at the time'
      ]
    },
    {
      id: 'q7',
      question: 'A heat map of incidents on your dashboard helps you to:',
      options: [
        'Find the hottest location in your office',
        'Identify geographic hotspots of HSSE incidents',
        'Track temperature variations by region',
        'Predict the weather for tomorrow'
      ]
    },
    {
      id: 'q8',
      question: 'Which regulation class covers safe handling and storage of chemicals?',
      options: [
        'Electrical Safety',
        'Fire Safety & Emergency Response',
        'Chemical & Hazardous Substances',
        'Noise & Vibration'
      ]
    }
  ];

  const checkAnswers = async () => {
    let newScore = 0;
    const newFeedback = {};

    for (const q in answers) {
      const selectedValue = selectedAnswers[q];
      if (selectedValue === answers[q]) {
        newScore++;
        newFeedback[q] = { correct: true, selected: selectedValue };
      } else {
        newFeedback[q] = { correct: false, selected: selectedValue || null };
      }
    }

    setScore(newScore);
    setFeedback(newFeedback);

    // Save to Supabase (optional)
    await supabase.from('quiz_results').insert([{
      user_id: 'anonymous', 
      score: newScore,
      total: Object.keys(answers).length,
      submitted_at: new Date()
    }]);
  };

  const resetQuiz = () => {
    setScore(null);
    setFeedback({});
    setSelectedAnswers({});
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center' }}>HSSE Quiz</h1>
      <form>
        {questions.map((q, idx) => {
          const userFeedback = feedback[q.id];
          return (
            <div key={q.id} style={{ marginBottom: '1.5rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '5px' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{idx + 1}. {q.question}</h2>
              <div>
                {q.options.map((opt, i) => {
                  const optionValue = String.fromCharCode(65 + i);
                  const isCorrect = answers[q.id] === optionValue;
                  const isSelected = selectedAnswers[q.id] === optionValue;

                  let color = 'inherit';
                  if (score !== null) {
                    if (isCorrect) {
                      color = 'green';
                    } else if (isSelected && !isCorrect) {
                      color = 'red';
                    }
                  }

                  return (
                    <label key={i} style={{ display: 'block', marginBottom: '0.3rem', color }}>
                      <input
                        type="radio"
                        name={q.id}
                        value={optionValue}
                        disabled={score !== null}
                        checked={isSelected || false}
                        onChange={(e) => {
                          setSelectedAnswers(prev => ({
                            ...prev,
                            [q.id]: e.target.value
                          }));
                        }}
                      />{' '}
                      {opt}
                    </label>
                  );
                })}

                {score !== null && userFeedback && !userFeedback.correct && (
                  <div style={{ color: 'red', marginTop: '0.5rem' }}>
                    ❌ You chose {userFeedback.selected || 'nothing'} — Correct answer: {answers[q.id]}
                  </div>
                )}

                {score !== null && userFeedback?.correct && (
                  <div style={{ color: 'green', marginTop: '0.5rem' }}>✅ Correct!</div>
                )}
              </div>
            </div>
          );
        })}

        {score === null ? (
          <button
            type="button"
            onClick={checkAnswers}
            style={{
              backgroundColor: '#007bcc',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'block',
              margin: '0 auto'
            }}
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={resetQuiz}
            style={{
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'block',
              margin: '0 auto'
            }}
          >
            Try Again
          </button>
        )}
      </form>

      {score !== null && (
        <div id="result" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1.5rem', textAlign: 'center' }}>
          You scored {score} out of {Object.keys(answers).length}.
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
