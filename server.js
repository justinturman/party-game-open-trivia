import { takeQuestions, startQuestionBank } from './bank.js';
const INVALID_MOVE = 'INVALID_MOVE';

const POINTS = { easy: 1, medium: 2, hard: 3 };
export const source = { take: takeQuestions };
export const init = startQuestionBank;

export const game = {
  name: 'open-trivia',
  minPlayers: 16,
  maxPlayers: 16,

  setup: ({ ctx, random }) => {
    const raw = source.take(100);
    const questions = raw.map((q) => {
      const options = random.Shuffle([q.answer, ...q.wrong]);
      return {
        text: q.text,
        category: q.category,
        difficulty: q.difficulty,
        options,
        correct: options.indexOf(q.answer),
        points: POINTS[q.difficulty] || 1,
      };
    });

    const scores = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      scores[String(i)] = 0;
    }

    return {
      questions,
      index: 0,
      scores,
      revealed: false, 
      lastWinner: null, 
      lastLoser: null,  
      lastChoice: null, // <--- ADD THIS
    };
  },

  turn: { activePlayers: { all: null } },

  playerView: ({ G, ctx }) => {
    const q = G.questions[G.index];
    return {
      index: G.index,
      scores: G.scores,
      revealed: G.revealed,
      lastWinner: G.lastWinner,
      lastLoser: G.lastLoser,
      lastChoice: G.lastChoice, // <--- ADD THIS
      question: q ? {
        text: q.text,
        category: q.category,
        difficulty: q.difficulty,
        options: q.options,
        points: q.points,
        correct: G.revealed ? q.correct : null,
      } : null,
    };
  },

  moves: {
    answer: {
      client: false, 
      move: ({ G, playerID }, choice) => {
        if (G.revealed) return INVALID_MOVE; 
        const q = G.questions[G.index];
        if (!q) return INVALID_MOVE;

        G.lastChoice = choice; // <--- SAVE THE CHOICE

        if (choice === q.correct) {
          G.revealed = true;
          G.lastWinner = playerID;
          G.scores[playerID] = (G.scores[playerID] || 0) + q.points;
        } else {
          G.revealed = true;
          G.lastLoser = playerID;
          G.scores[playerID] = (G.scores[playerID] || 0) - 1;
        }
      },
    },
    next: {
      client: false,
      move: ({ G, playerID, random }) => {
        if (G.lastWinner !== playerID && G.lastLoser !== playerID) return INVALID_MOVE;

        G.index += 1;
        G.revealed = false;
        G.lastWinner = null;
        G.lastLoser = null;
        G.lastChoice = null;

        // Fetch and append 50 new questions if we are near the end
        if (G.index >= G.questions.length - 10) {
          const raw = source.take(50);
          const newQuestions = raw.map((q) => {
            const options = random.Shuffle([q.answer, ...q.wrong]);
            return {
              text: q.text,
              category: q.category,
              difficulty: q.difficulty,
              options,
              correct: options.indexOf(q.answer),
              points: POINTS[q.difficulty] || 1,
            };
          });
          G.questions.push(...newQuestions);
        }
      },
    },
  },
};