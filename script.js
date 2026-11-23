//  store all the necessary html tag in a variable
const startSection = document.getElementById("start");
const quizSection = document.getElementById("quiz");
const resultSection = document.getElementById("result");
const startBtn = document.getElementById("btn-start");
const statusTag =  document.getElementById("status");
const category = document.getElementById("category");
const difficulty = document.getElementById("difficulty");
const type = document.getElementById("type");
const nextQuestionBtn = document.getElementById("next");
const optionsContainer = document.getElementById("answer_container");
const backToStartBtn = document.getElementById("back_to_start");

let hasAnswerChosen = false;


function shuffle(arr) {

    const copy = [...arr]
    for (let i = copy.length -1 ; i > 0; i--) {
        
        let j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];
        
    }

    return copy;
}


class Question {

    constructor(question, answer, options){
        this.question = decodeURIComponent(question);
        this.answer = decodeURIComponent(answer);
        this.options = shuffle(options).map(option => decodeURIComponent(option));
    }
}



class Quiz {
    constructor(questions, currentIndex, score) {
        this.questions = questions;
        this.currentIndex = currentIndex;
        this.score = score;
    }

    getCurrentQuestion() {

        return this.questions[this.currentIndex];

    }

    checkAnswer(answer) {
  
        if(this.questions[this.currentIndex].answer == answer) {
            return "correct";
        }

        return "wrong";
    }

    nextQuestion(){

        return this.questions[this.currentIndex + 1];

    }

    isFinished() {

        return this.currentIndex === (this.questions.length - 1);

    }
}

async function fetchQuestions(url) {
    
    const response = await fetch(url);

    if(!response.ok) {
        throw new Error(`${response.status}: Failed to fetch request.`); 
    }

    const data = await response.json();

    return data;

}

function generateURL(category, difficulty, type) {
    let category_number = category == "General Knowledge" ? "9" 
                                        : category == "Mathematics" ? "19" : 
                                        category == "Sports" ? "21" :
                                        category == "Geography" ? "22" : "23";
    const url = `https://opentdb.com/api.php?amount=10&category=${category_number}&difficulty=${difficulty}&type=${type}&encode=url3986`;
    
    return url;
}


function setStatus(text, type) {
    statusTag.textContent = text;
    statusTag.className = `status ${type}`;
}

function displayQuestion() {
    // quiz header
    options = document.querySelectorAll(".option");
    document.getElementById("quiz_status").innerHTML = `Question <span class="answered">${quiz.currentIndex + 1}</span> OF 10`;
    document.getElementById("percentage_complete").textContent = `${((quiz.currentIndex) / quiz.questions.length) * 100}% complete`;

    document.getElementById("progress").style.width = `${((quiz.currentIndex) / quiz.questions.length) * 100}%`;

    document.getElementById("question").textContent = quiz.getCurrentQuestion().question;

    let html = quiz.getCurrentQuestion().options.map((option, index) => {
        return `<button class="option" data-answer="${option.replaceAll('"', '&quot;')}">
            <div class="letter">${index == 0 ? "A": index == 1 ? "B" : index == 2 ? "C" : "D"}.</div>
            <p>${option}</p>
         </button>
        `
    }).join("");

    optionsContainer.innerHTML = html;

  nextQuestionBtn.disable = true;
  hasAnswerChosen = false;

  document.getElementById("timerTag").textContent = `00:15`;

  let count = 15;

  const timer = setInterval(() => {

    if (count == 0) {
      validateAnswer("");

      clearInterval(timer);
      return;
    }

    if (hasAnswerChosen) clearInterval(timer)

    count--;

    document.getElementById("timerTag").textContent = `00:${count < 10 ? 0 : ""}${count.toLocaleString()}`;
    
  }, 1000)
  
};


function validateAnswer(userAnswer) {

  if(quiz.checkAnswer(userAnswer) === "correct") quiz.score++;

  
  let options = optionsContainer.children;
  
  for (let option of options) {
    
    const optionText = option.textContent.split(".")[1].trim();

    if(quiz.checkAnswer(optionText) === "correct") {
      
      option.style.borderColor = "lightgreen";
      
    } else {
    
      option.style.borderColor = "lightcoral";
    }
    
   };

  hasAnswerChosen = true;
  nextQuestionBtn.disable = false;
};

function updateBestScore() {
    let bestScore;
    let totalQuestions = quiz.questions.length;
  
  if(localStorage.getItem("bestScore")) {

    bestScore = JSON.parse(localStorage.getItem("bestScore"));

    if (bestScore.score < score) {

      bestScore.score = score;

    }

  } else bestScore = { score: quiz.score, total: totalQuestions }

  localStorage.setItem("bestScore", JSON.stringify(bestScore));

  document.getElementById("best_score").textContent = `Your best Score is: ${(bestScore.score / bestScore.total) * 100}%`;
}

function displayResult() {
  
  resultSection.classList.remove("hidden");
  document.getElementById("correct_score").textContent = quiz.score + " answers";
  document.getElementById("wrong_score").textContent = (quiz.questions.length - quiz.score) + " answer";

  let score = quiz.score;
  let totalQuestions = quiz.questions.length;

  let progressWidth = Math.round(((totalQuestions - score) / totalQuestions) * 289);

  document.getElementById("ring-fill").style.strokeDashoffset = progressWidth;

  document.getElementById("score").innerHTML = `<strong>${score}</strong> / ${totalQuestions}`;

  document.getElementById("score_percent").textContent = `${(score / totalQuestions) * 100}% score`

  let remarkHtml = `
  <h3>${score >= 7 ? "Great work!": "Nice Attempt"}</h3>
  <p>${score >= 7 ? "You're buliding a brilliant habit.": "Not bad for an Attempt, keep it up.)"}</p>
  `;

  document.getElementById("remark").innerHTML = remarkHtml;

  updateBestScore();

}


let bestScore = JSON.parse(localStorage.getItem("bestScore"));

console.log(bestScore)

bestScore ? document.getElementById("best_score").textContent = `Your best Score is: ${(bestScore.score / bestScore.total) * 100}%` : "";


let quiz;

startBtn.addEventListener("click", async () => {
    try {
    
        setStatus("Loading..........", "loading");
        startBtn.disable = true;
        startBtn.style.cursor = "not-allowed"
        startBtn.textContent = "Fetching";

        const url = generateURL(category.value, difficulty.value, type.value)
        
        const data = await fetchQuestions(url);
        
        let results = data.results;

        // let results = JSON.parse(localStorage.getItem("results"));

        let questions = results.map(result => {

            return new Question(result.question, result.correct_answer, [...result.incorrect_answers, result.correct_answer])
        });


        
        document.getElementById("quiz_category").textContent = category.value;
        startSection.classList.add("hidden");
        resultSection.classList.add("hidden")
        quizSection.classList.remove("hidden");

        startBtn.textContent = "Start Quiz";
        startBtn.disable = false;
        startBtn.style.cursor = "pointer";
        setStatus("", "hidden")

        quiz = new Quiz(questions, 0, 0);

        displayQuestion();
    

    } catch (error) {

        setStatus("✗ " + error.message, "error");

        startBtn.textContent = "Try Again";

        console.error(error.message);
    }
});


nextQuestionBtn.addEventListener("click", () => {

  if(nextQuestionBtn.disable) return;

    if(quiz.isFinished()) {
      
        quizSection.classList.add("hidden");

        displayResult();
      
        return;
    }
    
    quiz.currentIndex++;

    displayQuestion();
});


optionsContainer.addEventListener("click", e => {

  if(hasAnswerChosen) return;

  const clickBtn = e.target.closest(".option");

  if(!clickBtn) return;
  
  validateAnswer(clickBtn.textContent.split(".")[1].trim());

});


document.getElementById("play_again").addEventListener("click", () => startBtn.click());


backToStartBtn.addEventListener("click", () => {

  startSection.classList.remove("hidden");

  resultSection.classList.add("hidden");

  updateBestScore();
  
});





