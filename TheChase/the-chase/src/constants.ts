export const BACKEND_URL: string = 'http://localhost:8000';

export async function getCurrentQuestion(){
    const response = await fetch(`${BACKEND_URL}/get_current_question/`);
    const data = await response.json();
    return data;
}
export type questionResponse = {
    question: string;
    options: string[];
    correct_answer: string;
  }
export type currQuestion = {
    question: questionResponse;
    number: number;
}
export async function submitAnswer(groupName: string, answer: string){
    const response = await fetch(`${BACKEND_URL}/submit_answer/${groupName}/${answer}`);
}

export async function checkAnswers(){
    const response = await fetch(`${BACKEND_URL}/check_answers}`)
}