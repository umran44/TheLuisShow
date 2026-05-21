import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .questions.glen_questions import QUESTIONS as GLEN_QUESTIONS
app = FastAPI()



ROUND_TO_QUESTION_MAP = {"glen": GLEN_QUESTIONS}
QUESTIONS_BASE_PATH = 'questions'
@app.get("/")
async def root():
    return {"message": "Welcome to the chase!"}

@app.get("/questions/{round_name}")
async def get_questions(round_name: str):
    questions = ROUND_TO_QUESTION_MAP.get(round_name)
    if not questions:
        raise HTTPException(404, detail=f'Round {round_name} does not exist')
    return {"questions": [{"question": question["question"], "options": question["options"]} for question in questions]}

@app.get("/check_answer/{round_name}/{question_number}/{answer}")
async def check_answer(round_name: str, question_number: int, answer: str):
    questions = ROUND_TO_QUESTION_MAP[round_name]
    question = questions[question_number - 1]
    correct_ans = question["correct_answer"]
    return {"response": correct_ans==answer}



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