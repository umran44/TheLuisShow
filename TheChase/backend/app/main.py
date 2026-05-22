import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from .questions.glen_questions import QUESTIONS


QUESTIONS_BASE_PATH = 'questions'
game_state = {
    "curr_question_index": 0,
    "frosh_answers": [],
    "chaser_answers": []
}
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting app")
    game_state = {}
    game_state["curr_question_index"] = 0
    game_state["frosh_answers"] = []
    game_state["chaser_answers"] = []
    yield
    print("Closing app")
    game_state = {}
app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Welcome to the chase!"}

def check_answer_helper(question_number: int, submitted_answer: str):
    question = QUESTIONS[question_number]
    correct_ans = QUESTIONS["correct_answer"]
    return correct_ans == submitted_answer

def get_most_recent_question_and_answer(answer_list):
    return {"question_number": len(answer_list), "answer": answer_list[-1]}
async def get_current_answers(request: Request):
    return {"frosh_answers": request.state.frosh_answers or [], "chaser_answers": request.state.chaser_answers or []}
@app.get("/questions/")
async def get_questions():
    print(game_state)
    return {"questions": QUESTIONS}
@app.post("/set_curr_question/{idx}")
async def set_curr_question(idx: int):
    game_state["curr_question_index"] = idx

@app.get("/get_current_question/")
def get_curr_question():
    return {"question": QUESTIONS[game_state["curr_question_index"]], "number": game_state["curr_question_index"]}

@app.get("/check_answer/{round_name}/{question_number}/{answer}")
async def check_answer(round_name: str, question_number: int, answer: str):
    questions = ROUND_TO_QUESTION_MAP[round_name]
    question = questions[question_number - 1]
    correct_ans = question["correct_answer"]
    return {"response": check_answer_helper(round_name, question_number, answer)}

@app.get("/initialize_game")
async def start_game(request: Request):
    request.state.frosh_answers = []
    request.state.chaser_answers = []
    return {"success": True}

@app.post("/submit_answer/{team_name}/{answer}")
async def submit_answer(team_name, answer):
    if team_name == "frosh":
        game_state["frosh_answers"].append(answer)
    elif team_name == "chaser":
        game_state["chaser_answers"].append(answer)
    else:
        return {"success": False}
    return {"success": True}

@app.get("/check_answers")
async def check_most_recent_answers(
):
    chaser_answers = game_state['chaser_answers']
    frosh_answers = game_state['frosh_answers']
    return {
        "chaser": check_answer_helper(
            game_state["curr_question_index"],
            chaser_answers[-1]
        ),
        "frosh": check_answer_helper(
            game_state["curr_question_index"],
            frosh_answers[-1],
        )
    }


origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)