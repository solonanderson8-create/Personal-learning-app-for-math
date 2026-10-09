import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, toLatex, previewLatex } from '../js/math/parse.js';

const tex = (s) => toLatex(parse(s));

test('numbers and fractions', () => {
  assert.equal(tex('3/4'), '\\frac{3}{4}');
  assert.equal(tex('0.5'), '0.5');
  assert.equal(tex('1,000'), '1000');
  assert.equal(tex('(x+1)/2'), '\\frac{x + 1}{2}');
  assert.equal(tex('-3/4'), '-\\frac{3}{4}');
});

test('powers and roots', () => {
  assert.equal(tex('x^2'), '{x}^{2}');
  assert.equal(tex('2x^2'), '2{x}^{2}');
  assert.equal(tex('sqrt(5)'), '\\sqrt{5}');
  assert.equal(tex('3sqrt(2)'), '3\\sqrt{2}');
  assert.equal(tex('(x+1)^2'), '{\\left(x + 1\\right)}^{2}');
  assert.equal(tex('2^-1'), '{2}^{-1}');
  assert.equal(tex('2^3^2'), '{2}^{{3}^{2}}');
});

test('minus binds below powers, like a calculator', () => {
  const t = parse('-x^2');
  assert.equal(t.type, 'neg');
  assert.equal(t.arg.op, '^');
});

test('implicit multiplication', () => {
  assert.equal(tex('2x'), '2x');
  assert.equal(tex('3(x+1)'), '3\\left(x + 1\\right)');
  assert.equal(tex('(a)(b)'), '\\left(a\\right)\\left(b\\right)');
  assert.equal(tex('2*3'), '2 \\cdot 3');
});

test('signs', () => {
  assert.equal(tex('5 - -2'), '5 - \\left(-2\\right)');
  assert.equal(tex('x + y'), 'x + y');
});

test('friendly symbols', () => {
  assert.equal(tex('6÷3'), '\\frac{6}{3}');
  assert.equal(tex('2×3'), '2 \\cdot 3');
  assert.equal(tex('√(9)'), '\\sqrt{9}');
  assert.equal(tex('5 − 2'), '5 - 2');
});

test('bad input throws', () => {
  for (const bad of ['', '3/', '1..2', '(2', '2)', '$', '*3']) {
    assert.throws(() => parse(bad), SyntaxError, bad);
  }
});

test('preview never throws and closes open brackets', () => {
  assert.deepEqual(previewLatex('sqrt(5'), { ok: true, latex: '\\sqrt{5}' });
  assert.deepEqual(previewLatex('3/'), { ok: false, latex: '' });
  assert.deepEqual(previewLatex('  '), { ok: true, latex: '' });
});
