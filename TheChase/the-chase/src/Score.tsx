import React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

type scoreBoardProps = {
    froshPosition: number;
    chaserPosition: number;
}

export default function ScoreBoard({froshPosition, chaserPosition}: scoreBoardProps){
    return (<Paper sx={{background: "white", color: "black", width: "100%"}} elevation={1}>
        <Stack direction="row" spacing={1} sx={{justifyContent: "space-evenly"}}>
            <Typography>Stackers Level: {froshPosition}</Typography>
            <Typography>Chaser Level: {chaserPosition}</Typography>
        </Stack>
    </Paper>)
}