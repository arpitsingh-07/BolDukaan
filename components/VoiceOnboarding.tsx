"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createSpeechToText, type SttLang, type SttSession } from "@/lib/stt";
import type { Storefront } from "@/lib/storefront";
import { StorefrontCard } from "./StorefrontCard";
import { ShareButton } from "./ShareButton";
import styles from "@/app/voice.module.css";

const BAR_COUNT = 5;

const LANGS: { code: SttLang; label: string }[] = [
  { code: "hi-IN", label: "हिंदी" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "en-IN", label: "English" },
];

type Status = "idle" | "recording" | "structuring" | "done" | "error";

interface StructureResponse {
  storefront?: Storefront;
  transcript?: string;
  partial?: boolean;
  error?: string;
}

export function VoiceOnboarding() {
  const [status, setStatus] = useState<Status>("idle");
  const [lang, setLang] = useState<SttLang>("hi-IN");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [partial, setPartial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() =>
    new Array(BAR_COUNT).fill(0.4),
  );
  const [sttSupported, setSttSupported] = useState(true);
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const sttRef = useRef(createSpeechToText());
  const sessionRef = useRef<SttSession | null>(null);
  const mergeRef = useRef(false);
  const storefrontRef = useRef<Storefront | null>(null);
  const reducedMotionRef = useRef(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const lastTranscriptRef = useRef<string | null>(null);
  const publishedSlugRef = useRef<string | null>(null);
  const publishedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    setSttSupported(sttRef.current.isSupported());
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    storefrontRef.current = storefront;
  }, [storefront]);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startAnalyser = useCallback(async () => {
    if (reducedMotionRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const usable = Math.min(24, data.length);
        const groupSize = Math.max(1, Math.floor(usable / BAR_COUNT));
        const next: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < groupSize; j++) {
            sum += data[i * groupSize + j] ?? 0;
          }
          const avg = sum / groupSize / 255;
          next.push(Math.max(0.18, Math.min(1, avg * 1.7)));
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // No mic / permission denied for the visualiser — STT will surface errors.
    }
  }, []);

  const runStructuring = useCallback(
    async (text: string, merge: boolean) => {
      setStatus("structuring");
      setError(null);
      lastTranscriptRef.current = text;
      try {
        const res = await fetch("/api/structure", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            transcript: text,
            existing: merge ? storefrontRef.current : null,
          }),
        });
        const data = (await res.json()) as StructureResponse;
        if (!res.ok || !data.storefront) {
          setError(data.error ?? "Couldn't build the storefront. Try again.");
          setStatus(storefrontRef.current ? "done" : "error");
          return;
        }
        setStorefront(data.storefront);
        setPartial(Boolean(data.partial));
        setStatus("done");
      } catch {
        setError("Network error. Check your connection and try again.");
        setStatus(storefrontRef.current ? "done" : "error");
      }
    },
    [],
  );

  const publish = useCallback(async () => {
    if (!storefrontRef.current) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storefront: storefrontRef.current,
          transcript: lastTranscriptRef.current,
          // Present on re-publish → server updates the same shop (token-gated).
          slug: publishedSlugRef.current,
          editToken: publishedTokenRef.current,
        }),
      });
      const data = (await res.json()) as {
        slug?: string;
        editToken?: string;
        error?: string;
      };
      if (!res.ok || !data.slug) {
        setPublishError(data.error ?? "Couldn't publish. Try again.");
        return;
      }
      publishedSlugRef.current = data.slug;
      publishedTokenRef.current = data.editToken ?? null;
      setPublicUrl(`${window.location.origin}/s/${data.slug}`);
    } catch {
      setPublishError("Network error while publishing.");
    } finally {
      setPublishing(false);
    }
  }, []);

  const endRecording = useCallback(() => {
    if (status !== "recording") return;
    stopAnalyser();
    sessionRef.current?.stop();
    sessionRef.current = null;
  }, [status, stopAnalyser]);

  const beginRecording = useCallback(
    (merge: boolean) => {
      if (status === "structuring" || status === "recording") return;
      mergeRef.current = merge;
      setError(null);
      setLiveTranscript("");
      setStatus("recording");
      void startAnalyser();
      sessionRef.current = sttRef.current.start(lang, {
        onPartial: (text) => setLiveTranscript(text),
        onFinal: (text) => {
          stopAnalyser();
          const trimmed = text.trim();
          if (trimmed.length >= 2) {
            void runStructuring(trimmed, mergeRef.current);
          } else {
            setStatus(storefrontRef.current ? "done" : "idle");
            setLiveTranscript("");
            if (!storefrontRef.current) {
              setError("I didn't catch that — hold the button and speak.");
            }
          }
        },
        onError: (message) => {
          stopAnalyser();
          setStatus(storefrontRef.current ? "done" : "error");
          setError(
            message === "not-allowed" || message === "service-not-allowed"
              ? "Microphone permission is needed. Allow mic access and try again."
              : "Speech recognition had a problem. Try again or type instead.",
          );
        },
      });
    },
    [lang, status, startAnalyser, stopAnalyser, runStructuring],
  );

  useEffect(() => {
    return () => {
      stopAnalyser();
      sessionRef.current?.stop();
    };
  }, [stopAnalyser]);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    beginRecording(Boolean(storefrontRef.current));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    endRecording();
  };

  const handleTypedSubmit = () => {
    const text = typedText.trim();
    if (text.length < 2) return;
    void runStructuring(text, false);
  };

  const startOver = () => {
    setStorefront(null);
    storefrontRef.current = null;
    setPartial(false);
    setLiveTranscript("");
    setTypedText("");
    setError(null);
    setStatus("idle");
    setPublicUrl(null);
    setPublishError(null);
    publishedSlugRef.current = null;
    publishedTokenRef.current = null;
    lastTranscriptRef.current = null;
  };

  const recording = status === "recording";
  const structuring = status === "structuring";
  const showTyping = typing || !sttSupported;

  const caption = storefrontRef.current
    ? { en: "Hold to add more", native: "और बताने के लिए दबाएँ" }
    : { en: "Hold and describe your shop", native: "दबाकर अपनी दुकान बताइए" };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} />
            BolDukaan
          </span>
          <h1 className={styles.title}>
            Bol, aur <span className={styles.amber}>dukaan</span> taiyaar.
          </h1>
          <p className={`${styles.subline} deva`}>
            बोलो — दुकान अपने आप बन जाएगी
          </p>

          <div className={styles.langRow} role="group" aria-label="Input language">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={lang === l.code ? styles.langChipActive : styles.langChip}
                aria-pressed={lang === l.code}
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {!showTyping && (
            <>
              <div className={`${styles.voiceWrap} ${recording ? styles.recording : ""}`}>
                <div className={`${styles.ring} ${styles.r1}`} />
                <div className={`${styles.ring} ${styles.r2}`} />
                <button
                  type="button"
                  className={styles.voiceBtn}
                  aria-label={caption.en}
                  disabled={structuring}
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onPointerLeave={onPointerUp}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <span className={styles.bars}>
                    {Array.from({ length: BAR_COUNT }).map((_, i) => (
                      <span
                        key={i}
                        className={styles.bar}
                        style={
                          recording
                            ? { transform: `scaleY(${levels[i] ?? 0.4})` }
                            : undefined
                        }
                      />
                    ))}
                  </span>
                </button>
              </div>

              <p className={styles.voiceCap}>
                {structuring ? "Building your storefront…" : caption.en}
                {!structuring && (
                  <span className={`${styles.voiceCapDeva} deva`}>
                    {caption.native}
                  </span>
                )}
              </p>

              <p className={`${styles.transcript} deva`} aria-live="polite">
                {liveTranscript}
              </p>

              <button
                type="button"
                className={styles.fallbackToggle}
                onClick={() => setTyping(true)}
              >
                Type instead
              </button>
            </>
          )}

          {showTyping && (
            <div className={styles.fallback}>
              {!sttSupported && (
                <p className={styles.statusNote}>
                  Voice input isn&apos;t available in this browser — type a
                  description instead.
                </p>
              )}
              <textarea
                className={`${styles.fallbackArea} deva`}
                placeholder="Mera Sharma General Store hai, Moga mein, subah 9 se raat 9 baje tak khula, atta daal chawal bechte hain, phone 98xxxxxxxx"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                rows={4}
              />
              <button
                type="button"
                className={styles.fallbackBtn}
                onClick={handleTypedSubmit}
                disabled={structuring || typedText.trim().length < 2}
              >
                {structuring ? "Building…" : "Build my storefront"}
              </button>
              {sttSupported && (
                <button
                  type="button"
                  className={styles.fallbackToggle}
                  onClick={() => setTyping(false)}
                >
                  Use voice instead
                </button>
              )}
            </div>
          )}

          {error && <p className={styles.errorNote}>{error}</p>}
        </div>
      </section>

      <section
        className={`${styles.result} ${storefront ? "" : styles.resultEmpty}`}
      >
        <div className={styles.resultInner}>
          {storefront ? (
            <>
              <p className={styles.flow}>
                your voice
                <span className={styles.arrow}>↓</span>
              </p>
              <div className={styles.reveal} key={JSON.stringify(storefront)}>
                <StorefrontCard storefront={storefront} />
              </div>
              {partial && (
                <p className={styles.partialNote}>
                  We saved what we heard — speak again to fill in the rest.
                </p>
              )}

              {publicUrl ? (
                <div className={styles.publishedBox}>
                  <span className={styles.publishedLabel}>Live at</span>
                  <a
                    className={styles.publishedLink}
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {publicUrl}
                  </a>
                  <ShareButton name={storefront.name} url={publicUrl} />
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={publish}
                    disabled={publishing}
                  >
                    {publishing ? "Updating…" : "Update published page"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={publish}
                  disabled={publishing}
                >
                  {publishing ? "Publishing…" : "Publish & get shareable link"}
                </button>
              )}

              {publishError && (
                <p className={styles.publishErrorNote}>{publishError}</p>
              )}

              <div className={styles.resultActions}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={startOver}
                >
                  Start over
                </button>
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>
              <p className={styles.placeholderTitle}>Your storefront preview</p>
              <p className={`${styles.placeholderSub} deva`}>
                यहाँ आपकी दुकान दिखेगी
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
