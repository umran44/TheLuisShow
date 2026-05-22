import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export type questionProps = {
    question: string;
    options: string[];
    roundNumber: number;
    correctAnswer: string;
    showCorrectAnswer?: boolean | null;
    allowAnswering?: boolean | null;
}
const ALPHABET = 'ABCD';
function getColor(correctAnswer: boolean){
    if (correctAnswer){
        return 'success';
    }
    else {
        return 'error';
    }
}
export default function QuestionDisplay(params: questionProps) {
    const {question, options, roundNumber, showCorrectAnswer, allowAnswering, correctAnswer} = params;
    return (<Stack direction="column" spacing="5">
        <Box>
            <Typography variant="h3">Round {roundNumber}</Typography>
            <Typography variant="h4"> {question} </Typography>
        </Box>
        <Stack direction="row" spacing="3" sx={{justifyContent: "space-between"}}>
        {options.map((option, idx) => {
            return (<Button key={option}
                disabled={!allowAnswering}
            sx={{padding: "1px", margin: 10,  width: "30%"}}
            variant="contained" size="large" color={showCorrectAnswer ? getColor(correctAnswer === option) : 'primary'}
            >
                {ALPHABET[idx]}: {option}
            </Button>)
        })}
        </Stack>
    </Stack>)
}