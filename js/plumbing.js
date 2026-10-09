// Stage 1 page: proves sign-in, cross-device saving, version, voice and math display.

import { VERSION, BUILT } from './version.js';
import { canSpeak, speak, voiceCount } from './speech.js';
import { previewLatex } from './math/parse.js';
import { deviceName } from './device.js';
import { configured, onUser, signIn, signOutNow, read, explain } from './cloud.js';
import { queue, flush, onChange } from './outbox.js';

const $ = (id) => document.getElementById(id);
const PATH = 'test/plumbing';

// --- 3. Version -----------------------------------------------------------
const built = new Date(`${BUILT}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
$('version').textContent = `v${VERSION} · ${built}`;

// --- 1. Sign in -----------------------------------------------------------
if (!configured) $('not-configured').hidden = false;

onUser((user) => {
  $('signin-form').hidden = !configured || !!user;
  $('signed-in').hidden = !user;
  if (user) {
    $('signin-msg').textContent = '';
    flush();
    loadCloud();
  } else {
    $('cloud-text').textContent = '—';
    $('cloud-from').textContent = '';
    if (configured) $('email').focus();
  }
});

$('signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('signin-msg').textContent = 'Signing in…';
  try {
    await signIn($('email').value, $('password').value);
    $('password').value = '';
  } catch (err) {
    $('signin-msg').textContent = explain(err);
  }
});

$('signout').addEventListener('click', () => signOutNow());

// --- 2. Save here, see it there --------------------------------------------
onChange((n) => {
  $('save-state').textContent = n === 0 ? '✓ Saved' : `⏳ Not saved yet (${n} waiting)`;
});

async function save() {
  const text = $('note').value.trim();
  if (!text) return;
  await queue(PATH, { text, device: deviceName(), savedAt: new Date().toISOString() });
  $('note').value = '';
  loadCloud();
}
$('save').addEventListener('click', save);
$('note').addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });

async function loadCloud() {
  try {
    const data = await read(PATH);
    $('cloud-text').textContent = data?.text ?? '(nothing yet)';
    $('cloud-from').textContent = data
      ? `Saved from ${data.device}, ${new Date(data.savedAt).toLocaleString()}`
      : '';
  } catch (err) {
    $('cloud-from').textContent = explain(err);
  }
}
$('reload').addEventListener('click', loadCloud);

// --- 4. Voice test --------------------------------------------------------
$('voice').addEventListener('click', async () => {
  if (!canSpeak()) {
    $('voice-msg').textContent = '✗ This browser cannot speak.';
    return;
  }
  $('voice-msg').textContent = 'Speaking…';
  const result = await speak('Voice test. One, two, three.');
  const voices = voiceCount();
  $('voice-msg').textContent = result === 'spoke'
    ? `✓ This browser can speak (${voices} voices). Did you hear it?`
    : `✗ No voice came out (${result}, ${voices} voices).`;
});

// --- 5. Math typing -------------------------------------------------------
function drawMath() {
  const view = $('math-view');
  const { ok, latex } = previewLatex($('math').value);
  if (!ok) { view.textContent = 'Keep typing…'; view.classList.add('waiting'); return; }
  view.classList.remove('waiting');
  if (!window.katex) { view.textContent = latex; return; }
  window.katex.render(latex || '\\phantom{0}', view, { throwOnError: false, displayMode: true });
}
$('math').addEventListener('input', drawMath);
window.addEventListener('load', drawMath);
