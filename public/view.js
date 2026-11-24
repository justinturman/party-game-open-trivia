(function () {
  const LETTERS = ['A', 'B', 'C', 'D'];
  const root = document.getElementById('root');

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
  const send = (name, ...args) => parent.postMessage({ type: 'move', name, args }, '*');

  function getScoreboard(G, names, currentPlayer) {
    const activeIds = Object.keys(G.scores).filter(id => {
      return names[id] && names[id] !== `Player ${Number(id) + 1}`;
    });
    const idsToShow = activeIds.length > 0 ? activeIds : Object.keys(G.scores);
    idsToShow.sort((a, b) => G.scores[b] - G.scores[a]);

    return `<ul class="scoreboard">` +
      idsToShow.map(id => `
        <li class="${id === currentPlayer ? 'winner' : ''}">
          <span>${esc(names[id] || `Player ${Number(id) + 1}`)}</span>
          <strong>${G.scores[id]}</strong>
        </li>
      `).join('') + `</ul>`;
  }

  function render(msg) {
    const { view, playerID, names, state } = msg;
    const { G } = state;

    if (!G.question) {
      root.innerHTML = `<h2>Waiting for questions…</h2>`;
      return;
    }

    const q = G.question;
    const isWinner = G.lastWinner === playerID;
    const isLoser = G.lastLoser === playerID;
    const isTv = view === 'public';
    
    const winnerName = G.lastWinner ? (names[G.lastWinner] || `Player ${Number(G.lastWinner) + 1}`) : '';
    const loserName = G.lastLoser ? (names[G.lastLoser] || `Player ${Number(G.lastLoser) + 1}`) : '';

    let statusHTML = '';
    let optionsHTML = '';
    let nextBtnHTML = '';

    if (G.revealed) {
      if (isTv) {
        if (G.lastWinner) statusHTML = `<h2 style="color:#81c784">${esc(winnerName)} got it right! +${q.points}</h2>`;
        else statusHTML = `<h2 style="color:#ef9a9a">${esc(loserName)} got it wrong! -1</h2>`;
      } else {
        if (isWinner) statusHTML = `<h2 style="color:#81c784">You got it right! +${q.points}</h2>`;
        else if (isLoser) statusHTML = `<h2 style="color:#ef9a9a">You got it wrong! -1</h2>`;
        else if (G.lastWinner) statusHTML = `<h2>${esc(winnerName)} got it right! +${q.points}</h2>`;
        else statusHTML = `<h2>${esc(loserName)} got it wrong! -1</h2>`;
      }

      optionsHTML = `<div class="options">` + q.options.map((o, i) => {
        let cls = '';
        if (i === q.correct) cls = 'right';
        else if (i === G.lastChoice) cls = 'wrong';
        return `<div class="opt ${cls}"><b>${LETTERS[i]}</b> ${esc(o)}</div>`;
      }).join('') + `</div>`;

      if (!isTv && (isWinner || isLoser)) {
        nextBtnHTML = `<button class="next-btn" id="next">Next Question ▶</button>`;
      }
    } else {
      statusHTML = `<h2>Tap the correct answer!</h2>`;
      optionsHTML = `<div class="options">` + q.options.map((o, i) => 
        `<button class="opt" data-choice="${i}"><b>${LETTERS[i]}</b> ${esc(o)}</button>`
      ).join('') + `</div>`;
    }

    if (isTv) {
      // Format difficulty with capitalization
      const diffLabel = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);
      
      root.innerHTML = `
        <p>Question ${G.index + 1} · ${esc(q.category)} · ${diffLabel} (${q.points} pts)</p>
        <p class="qtext">${esc(q.text)}</p>
        ${optionsHTML}
        ${statusHTML}
        ${getScoreboard(G, names, G.lastWinner || G.lastLoser)}
        <p class="credit">Some questions from opentdb.com (Open Trivia Database, CC BY-SA 4.0)</p>
      `;
    } else {
      root.innerHTML = `
        <p style="font-size:1.2rem">Your Score: <strong>${G.scores[playerID]}</strong></p>
        <p class="qtext">${esc(q.text)}</p>
        ${optionsHTML}
        ${statusHTML}
        ${nextBtnHTML}
      `;

      root.querySelectorAll('[data-choice]').forEach(b => {
        b.onclick = () => {
          root.querySelectorAll('button').forEach(x => x.disabled = true);
          send('answer', Number(b.dataset.choice));
        };
      });
      
      const next = document.getElementById('next');
      if (next) next.onclick = () => {
        next.disabled = true;
        send('next');
      };
    }
  }

  window.addEventListener('message', (e) => {
    if (e.source === parent && e.data && e.data.type === 'state') render(e.data);
  });
  parent.postMessage({ type: 'ready' }, '*');
})();