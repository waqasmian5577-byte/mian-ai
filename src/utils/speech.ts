// Speech utilities for Mian's AI

let currentAudio: HTMLAudioElement | null = null;

export async function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  // Stop any currently playing audio
  stopSpeaking();

  if (onStart) onStart();

  try {
    // Try Gemini TTS server endpoint first
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 500),
        voiceName: 'Puck',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioUrl) {
        currentAudio = new Audio(data.audioUrl);
        currentAudio.onended = () => {
          currentAudio = null;
          if (onEnd) onEnd();
        };
        currentAudio.onerror = (e) => {
          fallbackSpeechSynthesis(text, onEnd, onError);
        };
        await currentAudio.play();
        return;
      }
    }
  } catch (e) {
    console.warn('Server TTS failed, falling back to browser synthesis', e);
  }

  // Fallback to browser SpeechSynthesis
  fallbackSpeechSynthesis(text, onEnd, onError);
}

function fallbackSpeechSynthesis(
  text: string,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech synthesis not supported in this browser');
    return;
  }

  window.speechSynthesis.cancel();
  // Strip markdown symbols for cleaner speech
  const clean = text
    .replace(/[#*_`~>-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .slice(0, 400);

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
