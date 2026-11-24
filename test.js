import { game as Trivia, source } from './server.js';

// Fake questions
source.take = (n) => Array.from({ length: n }, (_, i) => ({
  text: `Q${i}`, category: 'Test', difficulty: 'easy', answer: 'right', wrong: ['w1', 'w2', 'w3']
}));

const G = Trivia.setup({ ctx: { numPlayers: 2 }, random: { Shuffle: (a) => a } });
console.log("Setup OK, questions:", G.questions.length);

// Player 0 answers correctly
const move = Trivia.moves.answer.move;
move({ G, playerID: '0', events: {} }, G.questions[0].correct);
console.log("Player 0 won?", G.lastWinner === '0');
console.log("Player 0 score:", G.scores['0']);
console.log("Revealed?", G.revealed);

// Player 1 answers incorrectly
const G2 = Trivia.setup({ ctx: { numPlayers: 2 }, random: { Shuffle: (a) => a } });
move({ G: G2, playerID: '1', events: {} }, (G2.questions[0].correct + 1) % 4);
console.log("Player 1 lost?", G2.lastLoser === '1');
console.log("Player 1 score:", G2.scores['1']);