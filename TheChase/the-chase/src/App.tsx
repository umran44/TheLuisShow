import React, {useState} from 'react';
import logo from './the_chase_logo.jpg';
import './App.css';
import Button from '@mui/material/Button';
import QuestionDisplay from './Question';
import {ROUNDS} from './constants';
import  {questionProps } from './Question';

const BACKEND_URL: string = 'http://localhost:8000'
async function getQuestions(round: string) {
  const response = await fetch(`${BACKEND_URL}/questions/${round}`);
  const data = await response.json();
  return data.questions;
}
function App() {
  const [questions, setQuestions] = useState<questionProps[]>([]);
  const [currQuestion, setCurrQuestion] = useState<number|null>(null);
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
                const loadedQuestions: questionProps[] = await getQuestions(round);
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
        <QuestionDisplay
        question={questions[currQuestion].question}
        options={questions[currQuestion].options}
        roundNumber={currQuestion + 1}
        />
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
