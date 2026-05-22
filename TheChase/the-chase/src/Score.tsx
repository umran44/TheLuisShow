import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type scoreBoardProps = {
    froshPosition: number;
    chaserPosition: number;
}

export default function ScoreBoard({froshPosition, chaserPosition}: scoreBoardProps){
    return (<Box sx={{background: "white", color: "black", width: "100%"}}>
        <Stack direction="row" spacing={1} sx={{justifyContent: "space-evenly"}}>
            <Typography>Stackers Level: {froshPosition}</Typography>
            <Typography>Chaser Level: {chaserPosition}</Typography>
        </Stack>
    </Box>)
}