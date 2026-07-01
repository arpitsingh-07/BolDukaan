/**
 * Speech-to-text behind a single interface. M0 uses the browser Web Speech API
 * (free, in-browser). To move to Whisper later, add another implementation of
 * `SpeechToText` and swap the factory — nothing else in the app changes.
 */

export type SttLang = "hi-IN" | "pa-IN" | "en-IN";

export interface SttCallbacks {
  /** Fired as recognition refines the in-progress transcript. */
  onPartial?: (text: string) => void;
  /** Fired once when a usable final transcript is available (on stop). */
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
}

export interface SttSession {
  stop: () => void;
}

export interface SpeechToText {
  isSupported: () => boolean;
  /** Begin listening. Call `.stop()` on the returned session to finish. */
  start: (lang: SttLang, callbacks: SttCallbacks) => SttSession;
}

/* ---- Minimal Web Speech API typings (not in the standard DOM lib) ---- */
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

class WebSpeechToText implements SpeechToText {
  isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  start(lang: SttLang, callbacks: SttCallbacks): SttSession {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      callbacks.onError?.("Speech recognition is not supported in this browser.");
      return { stop: () => {} };
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";
    let stopped = false;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += chunk;
        } else {
          interim += chunk;
        }
      }
      callbacks.onPartial?.((finalText + interim).trim());
    };

    recognition.onerror = (event) => {
      // "no-speech"/"aborted" are benign on release — only surface real errors.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        callbacks.onError?.(event.error || "Speech recognition error.");
      }
    };

    recognition.onend = () => {
      if (stopped) callbacks.onFinal?.(finalText.trim());
    };

    try {
      recognition.start();
    } catch {
      callbacks.onError?.("Could not start the microphone.");
    }

    return {
      stop: () => {
        stopped = true;
        try {
          recognition.stop();
        } catch {
          /* already stopped */
        }
      },
    };
  }
}

export function createSpeechToText(): SpeechToText {
  return new WebSpeechToText();
}
