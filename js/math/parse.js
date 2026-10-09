// Turns a typed answer like "3/4", "2x^2 - 5", "sqrt(5)" into a tree,
// and the tree into LaTeX for KaTeX to draw.
//
// Tree nodes:
//   { type: 'num', value: '3.5' }
//   { type: 'var', name: 'x' }
//   { type: 'neg', arg }
//   { type: 'bin', op: '+' | '-' | '*' | '/' | '^', left, right, implicit? }
//   { type: 'func', name: 'sqrt', arg }
//   { type: 'group', arg }            // the user typed ( ... )

const FUNCS = ['sqrt'];

// Friendly symbols people may type or paste.
const SWAPS = { '×': '*', '·': '*', '÷': '/', '−': '-', '–': '-', '√': 'sqrt' };

export function tokenize(text) {
  let s = '';
  for (const ch of String(text)) s += SWAPS[ch] ?? ch;
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const raw = s.slice(i, j).replace(/,/g, '');
      if ((raw.match(/\./g) || []).length > 1 || raw === '.') throw new SyntaxError('bad number');
      tokens.push({ t: 'num', v: raw });
      i = j; continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      const fn = FUNCS.find((f) => s.slice(i, i + f.length).toLowerCase() === f);
      if (fn) { tokens.push({ t: 'func', v: fn }); i += fn.length; continue; }
      tokens.push({ t: 'var', v: ch }); // single letters: "xy" means x times y
      i++; continue;
    }
    if ('+-*/^()'.includes(ch)) { tokens.push({ t: ch }); i++; continue; }
    throw new SyntaxError(`unknown symbol ${ch}`);
  }
  return tokens;
}

export function parse(text) {
  const tokens = tokenize(text);
  if (!tokens.length) throw new SyntaxError('empty');
  let pos = 0;
  const peek = () => tokens[pos];
  const take = (t) => {
    if (peek()?.t !== t) throw new SyntaxError(`expected ${t}`);
    return tokens[pos++];
  };

  // Can the next token start a factor with no "*" in front? (2x, 3(x+1), (a)(b))
  const startsFactor = (tok) => tok && ['num', 'var', 'func', '('].includes(tok.t);

  function expr() {
    let left = term();
    while (peek()?.t === '+' || peek()?.t === '-') {
      const op = tokens[pos++].t;
      left = { type: 'bin', op, left, right: term() };
    }
    return left;
  }

  function term() {
    let left = unary();
    for (;;) {
      const tok = peek();
      if (tok?.t === '*' || tok?.t === '/') {
        pos++;
        left = { type: 'bin', op: tok.t, left, right: unary() };
      } else if (startsFactor(tok)) {
        left = { type: 'bin', op: '*', left, right: power(), implicit: true };
      } else return left;
    }
  }

  function unary() {
    if (peek()?.t === '-') { pos++; return { type: 'neg', arg: unary() }; }
    if (peek()?.t === '+') { pos++; return unary(); }
    return power();
  }

  // Right-associative, and -x^2 means -(x^2), like a calculator.
  function power() {
    const base = primary();
    if (peek()?.t === '^') { pos++; return { type: 'bin', op: '^', left: base, right: unary() }; }
    return base;
  }

  function primary() {
    const tok = peek();
    if (!tok) throw new SyntaxError('unexpected end');
    if (tok.t === 'num') { pos++; return { type: 'num', value: tok.v }; }
    if (tok.t === 'var') { pos++; return { type: 'var', name: tok.v }; }
    if (tok.t === 'func') {
      pos++; take('(');
      const arg = expr();
      take(')');
      return { type: 'func', name: tok.v, arg };
    }
    if (tok.t === '(') {
      pos++;
      const arg = expr();
      take(')');
      return { type: 'group', arg };
    }
    throw new SyntaxError(`unexpected ${tok.t}`);
  }

  const tree = expr();
  if (pos < tokens.length) throw new SyntaxError(`unexpected ${tokens[pos].t}`);
  return tree;
}

// Brackets a fraction's top/bottom don't need: the fraction bar already groups them.
const unwrap = (n) => (n.type === 'group' ? n.arg : n);

export function toLatex(n) {
  switch (n.type) {
    case 'num': return n.value;
    case 'var': return n.name;
    case 'group': return `\\left(${toLatex(n.arg)}\\right)`;
    case 'func': return `\\sqrt{${toLatex(n.arg)}}`;
    case 'neg': return `-${toLatex(n.arg)}`;
    case 'bin': {
      const L = toLatex(n.left);
      const R = toLatex(n.right);
      if (n.op === '/') {
        // -3/4 reads as "negative three quarters", so put the sign in front of the bar.
        const sign = n.left.type === 'neg' ? '-' : '';
        const top = n.left.type === 'neg' ? n.left.arg : n.left;
        return `${sign}\\frac{${toLatex(unwrap(top))}}{${toLatex(unwrap(n.right))}}`;
      }
      if (n.op === '^') {
        const base = ['bin', 'neg'].includes(n.left.type) ? `\\left(${L}\\right)` : `{${L}}`;
        return `${base}^{${toLatex(unwrap(n.right))}}`;
      }
      if (n.op === '*') {
        // Show 2x and 3(x+1) as typed; use a dot only where numbers would run together.
        const numNext = n.right.type === 'num' || n.right.type === 'neg';
        return n.implicit && !numNext ? `${L}${R}` : `${L} \\cdot ${R}`;
      }
      const right = n.right.type === 'neg' ? `\\left(${R}\\right)` : R;
      return `${L} ${n.op} ${right}`;
    }
  }
  throw new Error(`unknown node ${n.type}`);
}

// For the live preview while typing. Never throws.
// Missing closing brackets are filled in so "sqrt(5" already shows a root.
export function previewLatex(text) {
  if (!String(text).trim()) return { ok: true, latex: '' };
  try {
    return { ok: true, latex: toLatex(parse(text)) };
  } catch {
    const open = (text.match(/\(/g) || []).length - (text.match(/\)/g) || []).length;
    if (open > 0) {
      try { return { ok: true, latex: toLatex(parse(text + ')'.repeat(open))) }; } catch { /* fall through */ }
    }
    return { ok: false, latex: '' };
  }
}
