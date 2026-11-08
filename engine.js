/* 中国象棋规则引擎（浏览器 + Node 通用）
 * 棋盘 10 行 x 9 列，board[y][x]
 * 红方（大写）在下：K 帅 A 士 E 相 R 车 H 马 C 炮 P 兵
 * 黑方（小写）在上：k 将 a 士 e 象 r 车 h 马 c 炮 p 卒
 */
var XQ = (function () {
  var ROWS = 10, COLS = 9;

  function initialBoard() {
    var b = [], y, x;
    for (y = 0; y < ROWS; y++) { b.push([]); for (x = 0; x < COLS; x++) b[y].push(''); }
    var back = ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'];
    for (x = 0; x < COLS; x++) b[0][x] = back[x];
    b[2][1] = 'c'; b[2][7] = 'c';
    b[3][0] = 'p'; b[3][2] = 'p'; b[3][4] = 'p'; b[3][6] = 'p'; b[3][8] = 'p';
    b[6][0] = 'P'; b[6][2] = 'P'; b[6][4] = 'P'; b[6][6] = 'P'; b[6][8] = 'P';
    b[7][1] = 'C'; b[7][7] = 'C';
    for (x = 0; x < COLS; x++) b[9][x] = back[x].toUpperCase();
    return b;
  }

  function isRed(p) { return p !== '' && p === p.toUpperCase(); }
  function sameSide(a, b) { if (!a || !b) return false; return isRed(a) === isRed(b); }
  function inBoard(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

  function cloneBoard(b) {
    var n = [], y;
    for (y = 0; y < ROWS; y++) n.push(b[y].slice());
    return n;
  }

  function findKing(b, red) {
    var x, y, k = red ? 'K' : 'k';
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) if (b[y][x] === k) return [x, y];
    return null;
  }

  /* 该棋子在此局面下的"伪合法"走法（不做被将军过滤） */
  function pseudoMovesFor(b, x, y, out) {
    var p = b[y][x]; if (!p) return out;
    var red = isRed(p), t = p.toUpperCase();
    var dx, dy, i, nx, ny, cnt, sx, sy;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    if (t === 'R') {
      for (i = 0; i < 4; i++) {
        nx = x + dirs[i][0]; ny = y + dirs[i][1];
        while (inBoard(nx, ny)) {
          if (!b[ny][nx]) { out.push([x, y, nx, ny]); }
          else { if (!sameSide(p, b[ny][nx])) out.push([x, y, nx, ny]); break; }
          nx += dirs[i][0]; ny += dirs[i][1];
        }
      }
      return out;
    }

    if (t === 'C') {
      for (i = 0; i < 4; i++) {
        dx = dirs[i][0]; dy = dirs[i][1];
        nx = x + dx; ny = y + dy; cnt = 0;
        while (inBoard(nx, ny)) {
          if (!b[ny][nx]) {
            if (cnt === 0) out.push([x, y, nx, ny]);
          } else {
            if (cnt === 0) { cnt = 1; }
            else { if (!sameSide(p, b[ny][nx])) out.push([x, y, nx, ny]); break; }
          }
          nx += dx; ny += dy;
        }
      }
      return out;
    }

    if (t === 'H') {
      var steps = [[1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1],
                   [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0]];
      for (i = 0; i < 8; i++) {
        nx = x + steps[i][0]; ny = y + steps[i][1];
        if (!inBoard(nx, ny)) continue;
        if (b[y + steps[i][3]][x + steps[i][2]]) continue;      // 马腿被别
        if (sameSide(p, b[ny][nx])) continue;
        out.push([x, y, nx, ny]);
      }
      return out;
    }

    if (t === 'E') {
      var eSteps = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
      for (i = 0; i < 4; i++) {
        nx = x + eSteps[i][0]; ny = y + eSteps[i][1];
        if (!inBoard(nx, ny)) continue;
        if (red && ny < 5) continue;                              // 相不过河
        if (!red && ny > 4) continue;                             // 象不过河
        if (b[y + eSteps[i][1] / 2][x + eSteps[i][0] / 2]) continue; // 塞象眼
        if (sameSide(p, b[ny][nx])) continue;
        out.push([x, y, nx, ny]);
      }
      return out;
    }

    if (t === 'A') {
      var steps2 = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (i = 0; i < 4; i++) {
        nx = x + steps2[i][0]; ny = y + steps2[i][1];
        if (!inBoard(nx, ny)) continue;
        if (nx < 3 || nx > 5) continue;
        if (red && (ny < 7 || ny > 9)) continue;
        if (!red && (ny < 0 || ny > 2)) continue;
        if (sameSide(p, b[ny][nx])) continue;
        out.push([x, y, nx, ny]);
      }
      return out;
    }

    if (t === 'K') {
      var steps3 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (i = 0; i < 4; i++) {
        nx = x + steps3[i][0]; ny = y + steps3[i][1];
        if (!inBoard(nx, ny)) continue;
        if (nx < 3 || nx > 5) continue;
        if (red && (ny < 7 || ny > 9)) continue;
        if (!red && (ny < 0 || ny > 2)) continue;
        if (sameSide(p, b[ny][nx])) continue;
        out.push([x, y, nx, ny]);
      }
      return out;
    }

    if (t === 'P') {
      // 红的向上（y-1），黑的向下（y+1）
      var fwd = red ? -1 : 1;
      ny = y + fwd;
      if (inBoard(x, ny) && !sameSide(p, b[ny][x])) out.push([x, y, x, ny]);
      // 过河后可横走
      var crossed = red ? y <= 4 : y >= 5;
      if (crossed) {
        if (x - 1 >= 0 && !sameSide(p, b[y][x - 1])) out.push([x, y, x - 1, y]);
        if (x + 1 < COLS && !sameSide(p, b[y][x + 1])) out.push([x, y, x + 1, y]);
      }
      return out;
    }
    return out;
  }

  function generatePseudo(b, red) {
    var out = [], x, y;
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      var p = b[y][x];
      if (!p || isRed(p) !== red) continue;
      pseudoMovesFor(b, x, y, out);
    }
    return out;
  }

  /* 将帅照面 */
  function kingsFaceEachOther(b) {
    var r = findKing(b, true), k = findKing(b, false);
    if (!r || !k || r[0] !== k[0]) return false;
    var y, x = r[0], lo = Math.min(r[1], k[1]), hi = Math.max(r[1], k[1]);
    for (y = lo + 1; y < hi; y++) if (b[y][x]) return false;
    return true;
  }

  /* 该方是否被将军（含飞将） */
  function inCheck(b, red) {
    var kp = findKing(b, red);
    if (!kp) return true;
    if (kingsFaceEachOther(b)) return true;
    var enemy = generatePseudo(b, !red), i;
    for (i = 0; i < enemy.length; i++) {
      if (enemy[i][2] === kp[0] && enemy[i][3] === kp[1]) return true;
    }
    return false;
  }

  function applyMove(b, m) {
    var nb = cloneBoard(b);
    nb[m[3]][m[2]] = nb[m[1]][m[0]];
    nb[m[1]][m[0]] = '';
    return nb;
  }

  /* 真合法走法（过滤自陷将军） */
  function legalMoves(b, red) {
    var pseudo = generatePseudo(b, red), out = [], i;
    for (i = 0; i < pseudo.length; i++) {
      var nb = applyMove(b, pseudo[i]);
      if (!inCheck(nb, red)) out.push(pseudo[i]);
    }
    return out;
  }

  function movesForPiece(b, x, y) {
    var p = b[y][x]; if (!p) return [];
    var red = isRed(p);
    var legal = legalMoves(b, red), out = [], i;
    for (i = 0; i < legal.length; i++) if (legal[i][0] === x && legal[i][1] === y) out.push(legal[i]);
    return out;
  }

  /* 走子后的局面判定 */
  function statusAfter(b, redToMove) {
    var lm = legalMoves(b, redToMove);
    if (lm.length === 0) return { over: true, loser: redToMove, reason: inCheck(b, redToMove) ? 'checkmate' : 'stalemate' };
    return { over: false, inCheck: inCheck(b, redToMove) };
  }

  /* ---------------- AI ---------------- */
  var VAL = { K: 100000, R: 900, H: 420, C: 460, A: 210, E: 210, P: 100 };

  function evaluateRed(b) {
    var score = 0, x, y, p;
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      p = b[y][x]; if (!p) continue;
      var t = p.toUpperCase(), v = VAL[t] || 0;
      // 兵过河加分、靠近底线加分
      if (t === 'P') {
        if (isRed(p)) { if (y <= 4) v += 90; v += (4 - y) * 6; }
        else { if (y >= 5) v += 90; v += (y - 5) * 6; }
      }
      // 车马炮居中略加分
      if (t === 'R' || t === 'C' || t === 'H') v += (4 - Math.abs(x - 4)) * 4;
      score += isRed(p) ? v : -v;
    }
    return score;   // 红方视角：正数=红优
  }

  function search(b, red, depth, alpha, beta) {
    if (depth <= 0) return (red ? 1 : -1) * evaluateRed(b);
    var moves = legalMoves(b, red);
    if (moves.length === 0) return -99000 - depth * 10;   // 被将死/困毙
    // 吃子优先排序
    moves.sort(function (a, c) {
      var va = b[a[3]][a[2]] ? (VAL[b[a[3]][a[2]].toUpperCase()] || 0) : 0;
      var vc = b[c[3]][c[2]] ? (VAL[b[c[3]][c[2]].toUpperCase()] || 0) : 0;
      return vc - va;
    });
    var best = -1e9, i;
    for (i = 0; i < moves.length; i++) {
      var nb = applyMove(b, moves[i]);
      var s = -search(nb, !red, depth - 1, -beta, -alpha);
      if (s > best) best = s;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  function bestMove(b, red, depth) {
    var moves = legalMoves(b, red);
    if (moves.length === 0) return null;
    moves.sort(function (a, c) {
      var va = b[a[3]][a[2]] ? (VAL[b[a[3]][a[2]].toUpperCase()] || 0) : 0;
      var vc = b[c[3]][c[2]] ? (VAL[b[c[3]][c[2]].toUpperCase()] || 0) : 0;
      return vc - va;
    });
    var best = null, bestScore = -1e9, alpha = -1e9, i;
    for (i = 0; i < moves.length; i++) {
      var nb = applyMove(b, moves[i]);
      var s = -search(nb, !red, depth - 1, -1e9, -alpha);
      s += Math.random() * 8;                     // 轻微随机，避免每局一模一样
      if (s > bestScore) { bestScore = s; best = moves[i]; alpha = Math.max(alpha, s); }
    }
    return best;
  }

  return {
    ROWS: ROWS, COLS: COLS,
    initialBoard: initialBoard,
    isRed: isRed,
    cloneBoard: cloneBoard,
    pseudoMovesFor: pseudoMovesFor,
    generatePseudo: generatePseudo,
    legalMoves: legalMoves,
    movesForPiece: movesForPiece,
    applyMove: applyMove,
    inCheck: inCheck,
    kingsFaceEachOther: kingsFaceEachOther,
    statusAfter: statusAfter,
    bestMove: bestMove,
    evaluateRed: evaluateRed
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = XQ;
