# CodeMaster — Frontend Fundamentals Quiz

A polished version of HTML, CSS, and JavaScript project. Five questions are preserved, with an answer-review screen, a saved personal best, shuffled question order, and a responsive design.

## Open the project

1. Extract the ZIP and keep `index.html`, `style.css`, and `script.js` together in the `quiz-app` folder.
2. Open the folder in Visual Studio Code.
3. Open `index.html` in your browser to try the quiz. All fonts and assets are local or built in; no installation or internet connection is required.

For consistent best-score persistence, serve the folder through a local server, such as the VS Code Live Server extension. Alternatively, if Python is installed, open a terminal in this folder, run `python -m http.server 8000`, then visit `http://localhost:8000`. Always return to the same browser and address to see the same saved record.

Browsers handle storage for directly opened `file:` pages differently. If storage is blocked, the quiz continues to work and labels the best score as available for this visit only. Private browsing and clearing browser data can remove the record. The application does not send scores anywhere.

## Included features

- Five original questions, with a small punctuation correction and explanatory feedback.
- A fresh question order on page load and every retry, without changing the original question bank.
- One answer per question, with text, a symbol, and green/red feedback.
- Progress counter, animated progress bar, and a right-aligned Next / Show result action.
- Results with accuracy, correct/incorrect totals, and a personal-best notification.
- An answer review in the exact order played, including the selected answer, correct answer, and explanation.
- A personal best stored in `localStorage` after completed attempts; lower scores never replace it.
- A complete reset for each retry while keeping the personal best.
- Mobile layouts, keyboard focus management, visible focus indicators, and reduced-motion support.
- No framework, build step, CDN, tracking, or external assets.

## Where to learn and edit

| File | What it contains |
| --- | --- |
| `index.html` | The page structure, quiz screen, results screen, and answer-review container. |
| `style.css` | Numbered sections for the theme, layout, buttons, feedback, results, review, responsiveness, and motion. Change the variables in `:root` to adjust the palette. |
| `script.js` | Ten numbered sections covering question data, page elements, state, storage, shuffling, rendering, answer selection, results, review, and event listeners. |

To add a question, copy one object in the `questions` array. Give it a unique `id`, a `category`, the question `text`, an `answers` array, a matching `correctAnswer`, and an `explanation`. The count and results adjust automatically. Changes to the question set reset the saved record for that set, so old and new scores are not mixed.

The progress bar measures **questions answered**. The counter tells you which question is currently on screen. Answer choices stay in their original order; the questions are shuffled.

## Important JavaScript functions

- `startQuiz()` resets an attempt and shuffles a copy of the question bank.
- `showQuestion()` creates the question and its answer buttons.
- `selectAnswer()` checks and records exactly one selection.
- `showResults()` computes the result and updates the best score.
- `renderReview()` builds the review from this attempt's selections.
- `loadBestScore()` and `saveBestScore()` handle browser storage safely.

The code uses `textContent` for question and answer text, so tags such as `<p>` appear as text rather than becoming HTML elements. Animations are disabled when the browser reports a preference for reduced motion.

## Quick manual check

1. Finish a round with a known mix of correct and incorrect answers.
2. Confirm the score, review selections, and explanations.
3. Retry and confirm a different question order, an empty progress bar, and enabled answer buttons.
4. Finish with a lower score and confirm the best score stays unchanged.
5. Reload from the same browser address and confirm the saved record remains.
6. Try a narrow phone-sized window and navigate with Tab, Shift+Tab, Enter, and Space.
