import React, {useState} from 'react';
import QuestionDisplay from './Question';
import Button from '@mui/material/Button';
import {getCurrentQuestion, submitAnswer, questionResponse, currQuestion }from './constants';


export default function ChaserDisplay(){
    const [contestantAnswer, setContestantAnswer] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [currQuestionResponse, setCurrQuestion] = useState<currQuestion | null>(null);
    const [allowAnswering, setAllowAnswering] = useState(true);
    return (
        <div>
            <Button onClick={async () => { 
                const question = await getCurrentQuestion();
                setCurrQuestion(question);
                setOptions(question.question.options);
                console.log("Loaded question");
            }}
            >
                View Question
            </Button>
        {(currQuestionResponse && 
        currQuestionResponse.question && options.length !== 0) ? <QuestionDisplay
            question={currQuestionResponse.question.question}
            options={options}
            correctAnswer={currQuestionResponse.question.correct_answer}
            roundNumber={currQuestionResponse.number}
            setSelectedAnswer={setContestantAnswer}
            allowAnswering={allowAnswering}

        />: <div/>}
            <Button
                onClick={() => 
                    {
                        submitAnswer("chaser", contestantAnswer);
                        setAllowAnswering(false);
                    }

                }
            >Submit Answer</Button>
        </div>

    )
}