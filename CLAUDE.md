# Learn Ladder — standing rules for Claude

Read this file and PLAN.md at the start of every session. Update PLAN.md at the end of every stage.

## The owner
- Adult with dyslexia and ADHD. Cannot write code. Claude builds everything.
- Devices: iPad (Safari) and Meta Quest 3 (Quest Browser), each with keyboard + mouse. No computer.
- Works through cloud sessions started from the iPad.

## Talking to the owner
- Short, plain messages. One step per line when they must tap or type.
- Never ask them to edit code or use a terminal.
- Be honest: if something is wrong or a choice is bad, say so.
- They like physical/mechanical analogies.
- Before writing code for a new stage: ask questions, then show a short plan.
- Build in small stages. Every stage ends with something they can open and try.

## Goal
Master math from basic arithmetic through college algebra.
Later (don't build yet, don't block): math beyond college algebra, spelling,
reading (words from real books, syllables), vision model for handwritten work.
So: subjects are data; nothing in the code assumes "math" only.

## Hosting
- Public repo `solonanderson8-create/learn-ladder`. Never commit anything private
  (no email address, no UID). The Firebase web config is not secret and is committed.
- GitHub Pages, "Deploy from a branch": `main`, folder `/ (root)`.
- NO GitHub Actions workflow files. Nothing is built on GitHub.
- `main` must always hold the ready-to-serve site. Keep `.nojekyll`.
- Site lives under a sub-path (`…github.io/learn-ladder/`): relative paths only.
- Third-party code is vendored into `vendor/` by `npm run vendor` (run by Claude,
  output committed). `node_modules/` is never committed.
- "Publish" = put the finished stage on `main`. If Claude can't, give exact merge taps.
  Publish at the end of every stage. Bump `js/version.js` (VERSION + BUILT) every publish.

## Saving (Firebase, free Spark plan)
- Email/password sign-in + Cloud Firestore. Sign-in form only, no sign-up.
- Rules lock all data to the owner's one account (see `firestore.rules`; UID only in console).
- Firestore offline cache is OFF (memoryLocalCache). Don't rely on it in the Quest browser.
- No answer may ever be lost: every write goes through `js/outbox.js` (localStorage queue,
  retried until saved). Show a small "saved" / "not saved yet" marker.
- History = log of attempts: skill, problem, answer, right/wrong, time taken, date.
  Mastery is computed from the log. Group the log (e.g. by month) so the app never
  re-downloads all history on open. Stay far inside free limits.
- Backup download button for all progress.

## Teaching rules
- Skill map is data, separate from code. Each skill lists the skills it depends on.
  Checklist: OpenStax Prealgebra → Elementary Algebra → Intermediate Algebra → College Algebra.
  Show the owner the map before building problems for it.
- Word problems are their own skill line: "words → math" tracked apart from "doing the calculation".
- Placement test: start easy, climb fast. Passing a skill credits skills beneath it
  (checked later by reviews). Under ~40 questions per sitting; can stop and resume.
  Never ask what they think they know.
- One wrong answer is never a gap (digit reversals, misread signs). Always give a second
  problem on the same skill. Miss that too → drill down prerequisites to the earliest broken one.
- New skill: fully worked example → examples with steps left blank → full problems.
- Practice: answer first, instant feedback. After a wrong answer: correct answer + worked
  steps for that exact problem, then a fresh problem.
- Passed = 3 full problems correct in a row in one session. Passing unlocks next skills.
- Mastered = passed, then correct in 3 later reviews on different days at growing gaps
  (~1, 3, 7 days, then longer).
- Failed review (two misses) → back to practice, before any new skill.
- Hole filling: can't pass after ~10 problems → re-check prerequisites, go to earliest weak one.
- Session: due reviews first (mixed, capped ~1/3 of session), then new learning.
- One big Start button; the app decides. The map also lets them pick a skill.
- Session timer: work/break adjustable, start 25/5 min. When work time ends, finish the
  problem, then offer a break. Stopping anytime loses nothing.
- Every tunable number lives in ONE settings file.

## Problems and answers
- No AI calls inside the app.
- Generators pick numbers in code and compute answer + worked steps. Never hand-type answers.
- Automated tests for every generator and for answer checking (`npm test`).
  Run all tests before every publish; report the result to the owner in one line.
- Typed answers: fractions `3/4`, powers `x^2`, roots `sqrt(5)`. Live preview in proper
  notation (KaTeX) as they type. Parser: `js/math/parse.js`.
- Accept equivalent answers (1/2, 2/4, 0.5) unless the skill is about form
  (simplify, factor). Algebra: compare by value; check form separately when it matters.
- Multiple choice only when typing isn't practical, with enough choices that guessing can't pass.
- "This problem looks wrong" button saves the problem for Claude to fix.

## Screen design
- Safari on iPad (touch + keyboard) and Quest Browser (keyboard + mouse, ~1280×670 window).
- Large text, generous spacing, one problem on screen at a time.
- Adjustable text size and letter spacing. Ordinary clean font (no dyslexia font).
- Very little reading. Short sentences.
- Read-aloud button for any text via the browser voice. Speak ONLY in direct response to
  a tap or key press. No voice → hide the button and say so once.
  All speech code stays in `js/speech.js` so another voice can be swapped in.
- Keyboard first: cursor starts in the answer box, Enter submits. On-screen number pad for touch.
  Nothing depends on hover.
- Light and dark themes. Never use colour alone for right/wrong (add ✓ / ✗ and words).
- Simple map: mastered / in review / next. Show today and this week. No penalties for missed days.
- Installable on the iPad home screen.

## Code layout
- Plain HTML/CSS/JS ES modules, no build step for the app itself.
- `index.html`, `styles.css` (all colours as role variables at the top).
- `js/version.js` version + date · `js/cloud.js` Firebase · `js/outbox.js` save queue
- `js/speech.js` voice · `js/math/parse.js` typed math → tree → LaTeX · `js/device.js`
- `tests/*.test.js` run with `npm test` (node's built-in test runner).
