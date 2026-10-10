// All read-aloud code lives here, so another voice can be swapped in later.
// Rule: only call speak() straight from a tap or key press.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

export function canSpeak() {
  return !!synth && 'SpeechSynthesisUtterance' in window;
}

// What the browser has, for the voice test. Helps find out why a voice is missing.
export function speechDetails() {
  if (typeof window === 'undefined') return 'no window';
  return [
    `speech: ${'speechSynthesis' in window ? 'yes' : 'no'}`,
    `utterance: ${'SpeechSynthesisUtterance' in window ? 'yes' : 'no'}`,
    `voices: ${window.speechSynthesis?.getVoices?.().length ?? 0}`,
  ].join(' · ');
}

// Resolves to 'spoke' when the voice actually started, or a reason it didn't.
export function speak(text, { rate = 0.95 } = {}) {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve('no-speech');
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = 'en-US';
    let started = false;
    u.onstart = () => { started = true; resolve('spoke'); };
    u.onerror = (e) => { if (!started) resolve(`error: ${e.error || 'unknown'}`); };
    // Some browsers have the speech object but no voices: nothing ever starts.
    setTimeout(() => { if (!started) resolve('silent'); }, 4000);
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) synth.cancel();
}

export function voiceCount() {
  return canSpeak() ? synth.getVoices().length : 0;
}
