import React, {useState} from 'react';
import logo from './the_chase_logo.jpg';
import './App.css';
import Button from '@mui/material/Button';
import QuestionDisplay from './Question';
import ScoreBoard from './Score';
import {BACKEND_URL, questionResponse, checkAnswers} from './constants';

async function getQuestions() {
  const response = await fetch(`${BACKEND_URL}/questions/`);
  const data = await response.json();
  return data.questions;
}


function App() {
  const [questions, setQuestions] = useState<questionResponse[]>([]);
  const [currQuestion, setCurrQuestion] = useState<number|null>(null);
  const [froshPosition, setFroshPosition] = useState(0);
  const [chaserPosition, setChaserPosition] = useState(0);
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
            <Button 
              onClick={async () => {
                const loadedQuestions: questionResponse[] = await getQuestions();
                setQuestions(loadedQuestions);
                setCurrQuestion(currQuestion === null ? 0 : currQuestion+1);
              }}
              size="large"
              variant="contained" color="error" sx={{margin: "10px", width: "10%"}}>
              Begin Game
            </Button>
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
        <Button 
        onClick={() => {
          setShowCorrectAnswer(true);
          checkAnswers();
          
          }} 
        variant="contained"
        color="error" sx={{margin: "10px", width: "10%"}}>
          Reveal Answers
        </Button>
        <Button variant="contained" color="error" sx={{margin: "10px", width: "10%"}}
          onClick={() => {setCurrQuestion(currQuestion + 1);
          setShowCorrectAnswer(false)}}
        >
          Next Question
        </Button>
        </>
        }
      </header>
    </div>
  );
}

export default App;
