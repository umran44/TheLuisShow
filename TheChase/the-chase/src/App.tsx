import React, {useState} from 'react';
import logo from './the_chase_logo.jpg';
import './App.css';
import Button from '@mui/material/Button';
import QuestionDisplay from './Question';
import {ROUNDS} from './constants';
import ScoreBoard from './Score';

const BACKEND_URL: string = 'http://localhost:8000'
async function getQuestions(round: string) {
  const response = await fetch(`${BACKEND_URL}/questions/${round}`);
  const data = await response.json();
  return data.questions;
}
type questionResponse = {
  question: string;
  options: string[];
  correct_answer: string;
}

function App() {
  const [questions, setQuestions] = useState<questionResponse[]>([]);
  const [currQuestion, setCurrQuestion] = useState<number|null>(null);
  const [froshPosition, setFroshPosition] = useState(0);
  const [chaserPosition, setChaserPosition] = useState(0);
  const [froshAnswer, setFroshAnswer] = useState<string | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [allowAnswer, setAllowAnswer] = useState(true);
  return (
    <div className="App">
      <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      {currQuestion === null && <>
        <p>
          Select a round to begin
        </p>
        {
          ROUNDS.map((round: string) => {
            return (
            <Button 
              onClick={async () => {
                const loadedQuestions: questionResponse[] = await getQuestions(round);
                setQuestions(loadedQuestions);
                setCurrQuestion(currQuestion === null ? 0 : currQuestion+1);
              }}
              size="large"
              variant="contained" color="error" sx={{margin: "10px", width: "10%"}}>
              {round}
            </Button>)
          })
        }
        </>}
        {currQuestion !== null && 
        <>
        <ScoreBoard froshPosition={froshPosition} chaserPosition={chaserPosition}/>
        <QuestionDisplay
          question={questions[currQuestion].question}
          options={questions[currQuestion].options}
          roundNumber={currQuestion + 1}
          correctAnswer={questions[currQuestion].correct_answer}
          showCorrectAnswer={showCorrectAnswer}
          allowAnswering={allowAnswer}
        />
        <Button onClick={() => {setShowCorrectAnswer(true); setAllowAnswer(false);}} variant="contained" color="error" sx={{margin: "10px", width: "10%"}}>
          Reveal Answers
        </Button>
        <Button variant="contained" color="error" sx={{margin: "10px", width: "10%"}} onClick={() => setCurrQuestion(currQuestion + 1)}>
          Next Question
        </Button>
        </>
        }
      </header>
    </div>
  );
}

export default App;
