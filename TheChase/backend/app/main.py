import os
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from .questions.glen_questions import QUESTIONS as GLEN_QUESTIONS
app = FastAPI()



ROUND_TO_QUESTION_MAP = {"glen": GLEN_QUESTIONS, 'zuev': GLEN_QUESTIONS, 'vaughn': GLEN_QUESTIONS}
QUESTIONS_BASE_PATH = 'questions'
@app.get("/")
async def root():
    return {"message": "Welcome to the chase!"}

def check_answer_helper(round_name: str, question_number: int, submitted_answer: str):
    questions = ROUND_TO_QUESTION_MAP[round_name]
    question = questions[question_number - 1]
    correct_ans = question["correct_answer"]
    return correct_ans == submitted_answer

def get_most_recent_question_and_answer(answer_list):
    return {"question_number": len(answer_list), "answer": answer_list[-1]}
async def get_current_answers(request: Request):
    return {"frosh_answers": request.state.frosh_answers or [], "chaser_answers": request.state.chaser_answers or []}
@app.get("/questions/{round_name}")
async def get_questions(round_name: str):
    questions = ROUND_TO_QUESTION_MAP.get(round_name)
    if not questions:
        raise HTTPException(404, detail=f'Round {round_name} does not exist')
    return {"questions": questions}

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

@app.post("/submit_answer/{round_name}/{team_name}/{question_number}/{answer}")
async def submit_answer(
    round_name: str, team_name: str, question_number: int, answer: str, request:Request):
    if team_name == "frosh":
        request.state.frosh_answers.append(answer)
    elif team_name == "chaser":
        request.state.chaser_answers.append(answer)
    else:
        return {"success": False}
    return {"success": True}
# async def get_timer()
@app.get("/check_answers")
async def check_most_recent_answers(
    round_name: str,
    answers: dict = Depends(get_current_answers)
):
    chaser_answers = answers['chaser_answers']
    last_chaser_answer = get_most_recent_question_and_answer(chaser_answers)
    frosh_answers = answers['frosh_answers']
    last_frosh_answer = get_most_recent_question_and_answer(frosh_answers)
    return {
        "chaser": check_answer_helper(
            round_name,
            last_chaser_answer["question_number"],
            last_chaser_answer["answer"]
        ),
        "frosh": check_answer_helper(
            round_name,
            last_frosh_answer["question_number"],
            last_frosh_answer["answer"]
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