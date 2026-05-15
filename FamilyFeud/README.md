# Family Feud Website

A local web application that runs the Family Feud game with two pages: a display page for the audience and a host control page.

## Features

- **Display Page**: Shows the question, hidden answers, team names, and points
- **Host Control Page**: Shows all answers (clickable), manages game state, and controls strikes
- **Real-time Communication**: Uses WebSockets for instant updates between host and display
- **Sound Effects**: Ding sound for correct answers, buzzer for incorrect, and winning music
- **Visual Animations**: Answer reveals with smooth animations, strike indicators, and winning screen
- **Team Management**: Update team names and points in real-time
- **Question Bank**: Pre-loaded questions from Family Feud

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Usage

### Display Page
Open `http://localhost:3000/display` in your browser to show this page to the audience on a projector or TV.

### Host Control Page
Open `http://localhost:3000/host` in another browser window on your host computer to control the game.

## How to Play

1. **Set up teams**: Enter team names and points on the host page
2. **Load a question**: Select a question from the dropdown and click "Load Question"
3. **Reveal answers**: Click on each answer on the host page to reveal it on the display
4. **Track strikes**: Use the strike buttons to track incorrect guesses
5. **Next round**: Click "Next Round" to reset and load a new question

## Game Flow

- Fast players buzz in (physically - not part of this app)
- Host clicks the answer the contestant guesses
- If correct: Display shows the answer with a ding sound and animation
- If incorrect: Display shows an X with a buzzer sound, and strike count increases
- If all answers are revealed: Winning screen and winning music plays
- If team gets 3 strikes: Other team can steal with one correct answer

## Files Structure

- `server.js` - Express server with WebSocket support
- `public/display.html` - Display page HTML
- `public/host.html` - Host control page HTML
- `public/css/` - Styling for both pages
- `public/js/` - JavaScript for display and host pages
- `data/questions.json` - Question bank
- `package.json` - Node.js dependencies

## Customization

### Adding Questions

Edit `data/questions.json` to add more questions:

```json
{
  "question": "Your question here?",
  "answers": [
    { "text": "Answer 1", "frequency": 50 },
    { "text": "Answer 2", "frequency": 30 }
  ]
}
```

### Changing Team Names

Use the host control page to update team names and points in real-time.

## Technical Details

- **Backend**: Node.js with Express
- **Real-time Communication**: WebSocket (ws library)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Sound**: Web Audio API for generated sound effects

## Notes

- The server uses WebSockets to communicate between the host and display pages
- Sound effects are generated using the Web Audio API (no external files needed)
- All answers are hidden on the display page until the host reveals them
- The display page will auto-reconnect if the connection is lost
