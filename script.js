"use strict";

// 1. Question bank. Add another object here to expand the quiz.
// Keep each id unique. The saved record is tied to this exact question set.
const questions = [
    {
        id: "css-styling",
        category: "CSS",
        text: "Which language is used to style a webpage?",
        answers: ["HTML", "CSS", "JavaScript"],
        correctAnswer: "CSS",
        explanation: "CSS controls a webpage’s appearance, including its colours, spacing, fonts, and layout."
    },
    {
        id: "html-paragraph",
        category: "HTML",
        text: "Which HTML tag creates a paragraph?",
        answers: ["<h1>", "<p>", "<button>"],
        correctAnswer: "<p>",
        explanation: "The <p> element represents a paragraph. Use <h1> for a main heading and <button> for an interactive button."
    },
    {
        id: "html-hyperlink",
        category: "HTML",
        text: "Which HTML tag is used to create a hyperlink on a webpage?",
        answers: ["<a>", "<url>", "<href>"],
        correctAnswer: "<a>",
        explanation: "The <a> (anchor) element creates a hyperlink when it has an href attribute, which specifies its destination."
    },
    {
        id: "css-class-selector",
        category: "CSS",
        text: "In CSS, which special character is used to target an element by its class attribute?",
        answers: ["$", "#", "."],
        correctAnswer: ".",
        explanation: "A dot selects a class: .quiz-card matches class=\"quiz-card\". A hash (#) selects an element by its id."
    },
    {
        id: "js-function-call",
        category: "JavaScript",
        text: "How do you correctly call or execute a function named greet in JavaScript?",
        answers: ["greet()", "call(greet)", "run.greet()"],
        correctAnswer: "greet()",
        explanation: "Parentheses after a function’s name call it. Writing greet refers to the function; greet() executes it."
    }
];

// 2. Find the parts of the page that JavaScript updates.986
const questionElement = document.getElementById("question");
const answersContainer = document.getElementById("answers");
const feedbackArea = document.getElementById("feedback-area");
const feedback = document.getElementById("feedback");
const feedbackDetail = document.getElementById("feedback-detail");
const nextButton = document.getElementById("next-button");
const nextLabel = document.getElementById("next-label");
const restartButton = document.getElementById("restart-button");
const progressElement = document.getElementById("progress");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const categoryElement = document.getElementById("question-category");
const answerHint = document.getElementById("answer-hint");
const quizPanel = document.getElementById("quiz-panel");
const resultsPanel = document.getElementById("results-panel");
const reviewButton = document.getElementById("review-button");
const reviewPanel = document.getElementById("review-panel");
const reviewList = document.getElementById("review-list");
const reviewTitle = document.getElementById("review-title");
const resultTitle = document.getElementById("result-title");
const ringValue = document.getElementById("ring-value");
const recordBadge = document.getElementById("record-badge");
const bestScoreElement = document.getElementById("best-score");
const bestDescription = document.getElementById("best-description");
const storageNote = document.getElementById("storage-note");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// 3. Quiz state: the data that changes during an attempt.
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let answeredCurrentQuestion = false;
let quizComplete = false;
let storageAvailable = true;
let ringAnimationFrame = 0;

const STORAGE_KEY = "syntax-quiz-best-score-v1";
const QUIZ_SIGNATURE = JSON.stringify(questions.map(function (question) {
    return [question.id, question.text, question.answers, question.correctAnswer];
}));
let bestScore = loadBestScore();

// 4. Storage. If the browser blocks storage, the quiz still works.
function loadBestScore() {
    let savedValue;
    try {
        savedValue = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        storageAvailable = false;
        return null;
    }

    if (savedValue === null) return null;

    try {
        const saved = JSON.parse(savedValue);
        if (
            saved &&
            saved.signature === QUIZ_SIGNATURE &&
            saved.total === questions.length &&
            Number.isInteger(saved.score) &&
            saved.score >= 0 &&
            saved.score <= questions.length
        ) {
            return saved.score;
        }
    } catch (error) {
        // Ignore damaged or unrelated data rather than breaking the quiz.
    }
    return null;
}

function saveBestScore() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            score: bestScore,
            total: questions.length,
            signature: QUIZ_SIGNATURE
        }));
    } catch (error) {
        storageAvailable = false;
    }
}

function updateBestScoreDisplay() {
    bestScoreElement.textContent = bestScore === null ? "—" : bestScore;
    document.getElementById("best-total").textContent = questions.length;
    bestDescription.textContent = bestScore === null
        ? "Your first finish starts the story."
        : bestScore === questions.length
            ? "A perfect round. Nicely done."
            : "A little better, one round at a time.";
    storageNote.textContent = storageAvailable
        ? "Saved on this browser"
        : "Best score kept for this visit only";
}

// 5. Fisher–Yates shuffle: mix a copy, leaving the original bank untouched.
function shuffleQuestions(questionList) {
    const shuffled = [...questionList];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const temporaryQuestion = shuffled[index];
        shuffled[index] = shuffled[randomIndex];
        shuffled[randomIndex] = temporaryQuestion;
    }
    return shuffled;
}

function startQuiz(moveFocus = false) {
    const previousOrder = quizQuestions.map(function (question) {
        return question.id;
    }).join("|");
    quizQuestions = shuffleQuestions(questions);

    // A random shuffle can repeat. Rotate that rare repeat for a fresh round.
    const newOrder = quizQuestions.map(function (question) {
        return question.id;
    }).join("|");
    if (quizQuestions.length > 1 && previousOrder === newOrder) {
        quizQuestions.push(quizQuestions.shift());
    }

    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    quizComplete = false;
    answeredCurrentQuestion = false;
    window.cancelAnimationFrame(ringAnimationFrame);
    ringValue.style.strokeDashoffset = "100";

    resultsPanel.hidden = true;
    reviewPanel.hidden = true;
    reviewList.replaceChildren();
    reviewButton.setAttribute("aria-expanded", "false");
    reviewButton.textContent = "Review answers";
    quizPanel.hidden = false;

    document.getElementById("question-total").textContent = questions.length;
    progressTrack.setAttribute("aria-valuemax", questions.length);
    updateBestScoreDisplay();
    showQuestion(moveFocus);
}

// 6. Render the current question and attach one listener per answer.
function showQuestion(moveFocus = true) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    answeredCurrentQuestion = false;
    questionElement.textContent = currentQuestion.text;
    categoryElement.textContent = currentQuestion.category;
    progressElement.textContent = "Question " + (currentQuestionIndex + 1) + " of " + quizQuestions.length;
    nextLabel.textContent = currentQuestionIndex === quizQuestions.length - 1 ? "Show result" : "Next question";
    nextButton.disabled = true;
    answerHint.textContent = "One answer. Make it count.";

    answersContainer.replaceChildren();
    feedback.textContent = "";
    feedbackDetail.textContent = "";
    feedbackArea.classList.remove("correct", "incorrect");
    updateProgress();

    currentQuestion.answers.forEach(function (answer, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button";
        button.dataset.answer = answer;

        const letter = document.createElement("span");
        letter.className = "answer-letter";
        letter.textContent = String.fromCharCode(65 + index);
        letter.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.className = "answer-text";
        // textContent safely displays HTML tags as text, rather than markup.
        label.textContent = answer;
        if (/[<>()#.$]/.test(answer)) {
            label.classList.add("code-answer");
        }

        const status = document.createElement("span");
        status.className = "answer-status";
        status.setAttribute("aria-hidden", "true");

        button.append(letter, label, status);
        button.addEventListener("click", function () {
            selectAnswer(answer, button, currentQuestion);
        });
        answersContainer.appendChild(button);
    });

    animateEntrance(document.getElementById("question-content"));
    if (moveFocus) {
        questionElement.focus({ preventScroll: true });
    }
}

function updateProgress() {
    const answeredCount = userAnswers.length;
    progressFill.style.width = (answeredCount / quizQuestions.length * 100) + "%";
    progressTrack.setAttribute("aria-valuenow", answeredCount);
    progressTrack.setAttribute("aria-valuetext", answeredCount + " of " + quizQuestions.length + " questions answered");
}

// 7. Record one answer per question. This guard also stops double counting.
function selectAnswer(answer, selectedButton, question) {
    if (answeredCurrentQuestion || quizComplete) return;
    answeredCurrentQuestion = true;

    const isCorrect = answer === question.correctAnswer;
    const outcome = isCorrect ? "correct" : "incorrect";
    if (isCorrect) score += 1;

    userAnswers.push({ question: question, selectedAnswer: answer, isCorrect: isCorrect });
    selectedButton.classList.add(outcome);
    selectedButton.querySelector(".answer-status").textContent = isCorrect ? "✓" : "×";
    selectedButton.setAttribute("aria-label", answer + (isCorrect ? ", correct answer" : ", incorrect answer"));
    feedbackArea.classList.add(outcome);
    feedback.textContent = isCorrect ? "That’s right. Well done!" : "Not quite. The answer is " + question.correctAnswer + ".";
    feedbackDetail.textContent = question.explanation;

    answersContainer.querySelectorAll("button").forEach(function (button) {
        button.disabled = true;
    });
    answerHint.textContent = "Answer locked in.";
    nextButton.disabled = false;
    updateProgress();
    // The selected answer is now disabled; focus the next available action.
    nextButton.focus({ preventScroll: true });
}

// 8. Results: save only completed attempts, and never lower a best score.
function showResults() {
    if (quizComplete) return;
    quizComplete = true;
    quizPanel.hidden = true;
    resultsPanel.hidden = false;

    // Check again in case another tab has recorded a better result.
    const storedBest = loadBestScore();
    if (storedBest !== null && (bestScore === null || storedBest > bestScore)) {
        bestScore = storedBest;
    }
    const firstAttempt = bestScore === null;
    const newRecord = firstAttempt || score > bestScore;
    if (newRecord) {
        bestScore = score;
        saveBestScore();
    }
    updateBestScoreDisplay();

    const percentage = Math.round(score / quizQuestions.length * 100);
    document.getElementById("result-percent").textContent = percentage + "%";
    document.getElementById("result-summary").textContent = "You scored " + score + " out of " + quizQuestions.length + ".";
    document.getElementById("correct-count").textContent = score;
    document.getElementById("incorrect-count").textContent = quizQuestions.length - score;
    recordBadge.hidden = !newRecord;
    recordBadge.textContent = storageAvailable
        ? (firstAttempt ? "First score saved" : "New personal best")
        : "New best for this visit";

    if (percentage === 100) {
        resultTitle.textContent = "You know your fundamentals.";
        document.getElementById("result-message").textContent = "A clean sweep. Take a look at the explanations, or keep the momentum going with another round.";
    } else if (percentage >= 60) {
        resultTitle.textContent = "You’re building momentum.";
        document.getElementById("result-message").textContent = "A solid foundation, with a little room to grow. Review your answers and give it another go.";
    } else {
        resultTitle.textContent = "Every round is a fresh start.";
        document.getElementById("result-message").textContent = "The best part of practice is what you learn. Review the explanations, then try another round.";
    }

    renderReview();
    animateEntrance(resultsPanel);
    resultTitle.focus({ preventScroll: true });
    // Two frames allow the ring's empty starting position to be painted first.
    ringAnimationFrame = window.requestAnimationFrame(function () {
        ringAnimationFrame = window.requestAnimationFrame(function () {
            if (quizComplete) {
                ringValue.style.strokeDashoffset = String(100 - percentage);
            }
        });
    });
}

// 9. Build a review using this attempt's order and selections, not the bank order.
function renderReview() {
    reviewList.replaceChildren();
    document.getElementById("review-count").textContent = userAnswers.length + " questions reviewed";

    userAnswers.forEach(function (entry, index) {
        const item = document.createElement("li");
        item.className = "review-item " + (entry.isCorrect ? "correct" : "incorrect");
        const number = makeTextElement("span", "review-number", String(index + 1).padStart(2, "0"));
        number.setAttribute("aria-hidden", "true");
        const content = document.createElement("div");
        content.className = "review-content";
        const meta = document.createElement("div");
        meta.className = "review-meta";
        meta.append(
            makeTextElement("span", "review-category", entry.question.category),
            makeTextElement("span", "review-status", entry.isCorrect ? "✓ Correct" : "× To revisit")
        );
        const title = makeTextElement("h3", "", entry.question.text);
        const answerDetails = document.createElement("div");
        answerDetails.className = "review-answers";
        const selected = makeTextElement("p", "review-answer selected-answer", "Your answer:");
        selected.appendChild(makeTextElement("strong", "", entry.selectedAnswer));
        answerDetails.appendChild(selected);

        if (!entry.isCorrect) {
            const correct = makeTextElement("p", "review-answer", "Correct answer:");
            correct.appendChild(makeTextElement("strong", "", entry.question.correctAnswer));
            answerDetails.appendChild(correct);
        }

        content.append(meta, title, answerDetails, makeTextElement("p", "review-explanation", entry.question.explanation));
        item.append(number, content);
        reviewList.appendChild(item);
    });
}

function makeTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function animateEntrance(element) {
    if (reducedMotion.matches || typeof element.animate !== "function") return;
    element.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 280, easing: "ease-out" }
    );
}

// 10. User actions and first render. Register listeners once, not on every round.
nextButton.addEventListener("click", function () {
    if (!answeredCurrentQuestion || quizComplete) return;
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex += 1;
        showQuestion();
    } else {
        showResults();
    }
});

reviewButton.addEventListener("click", function () {
    const shouldOpen = reviewPanel.hidden;
    reviewPanel.hidden = !shouldOpen;
    reviewButton.setAttribute("aria-expanded", String(shouldOpen));
    reviewButton.textContent = shouldOpen ? "Hide review" : "Review answers";
    if (shouldOpen) {
        reviewTitle.focus({ preventScroll: true });
        reviewPanel.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
    }
});

restartButton.addEventListener("click", function () {
    startQuiz(true);
});
document.getElementById("review-restart-button").addEventListener("click", function () {
    startQuiz(true);
    document.getElementById("quiz-card").scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
});

startQuiz();
