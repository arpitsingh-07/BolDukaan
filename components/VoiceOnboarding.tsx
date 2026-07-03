"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createSpeechToText, type SttSession } from "@/lib/stt";
import type { Storefront } from "@/lib/storefront";
import { UI_LANGS, uiToSttLang, t, LANG_COOKIE, type UiLang } from "@/lib/i18n";
import { StorefrontCard } from "./StorefrontCard";
import { ShareButton } from "./ShareButton";
import styles from "@/app/voice.module.css";

const BAR_COUNT = 5;

type Status = "idle" | "recording" | "structuring" | "done" | "error";

interface StructureResponse {
  storefront?: Storefront;
  transcript?: string;
  partial?: boolean;
  error?: string;
}

/**
 * Anonymous publishes are owned via an edit token. Persist it locally so the
 * owner can come back later and still update their page (losing the token
 * means losing edit access until they sign in and claim the shop in M2+).
 */
const STORAGE_KEY = "boldukaan.published.v1";
const LANG_STORAGE_KEY = "boldukaan.lang.v1";

interface StoredPublish {
  slug: string;
  editToken: string;
  storefront: Storefront;
}

/** Persist the language for BOTH worlds: localStorage (client) + cookie (server components). */
function persistLang(lang: UiLang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

function loadStoredPublish(): StoredPublish | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredPublish>;
    if (
      typeof data.slug === "string" &&
      typeof data.editToken === "string" &&
      data.storefront &&
      typeof data.storefront === "object"
    ) {
      return data as StoredPublish;
    }
  } catch {
    /* corrupted or unavailable storage — ignore */
  }
  return null;
}

export function VoiceOnboarding({
  initialStorefront = null,
  initialSlug = null,
  nav = null,
}: {
  /** Seed the editor with an existing storefront (dashboard "Edit" flow). */
  initialStorefront?: Storefront | null;
  /** When set, editing updates this shop via logged-in ownership. */
  initialSlug?: string | null;
  /** Account controls, rendered inside the petrol hero (server component slot). */
  nav?: ReactNode;
} = {}) {
  const [status, setStatus] = useState<Status>(
    initialStorefront ? "done" : "idle",
  );
  const [uiLang, setUiLang] = useState<UiLang>("hi");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [storefront, setStorefront] = useState<Storefront | null>(
    initialStorefront,
  );
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
  // Callbacks below are memoized with empty deps; a ref keeps the language
  // they read current (same stale-closure fix as storefrontRef).
  const uiLangRef = useRef<UiLang>("hi");

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const lastTranscriptRef = useRef<string | null>(null);
  const publishedSlugRef = useRef<string | null>(null);
  const publishedTokenRef = useRef<string | null>(null);

  const router = useRouter();
  const tr = t(uiLang);

  useEffect(() => {
    setSttSupported(sttRef.current.isSupported());
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Restore the user's app language (and sync the server cookie).
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === "en" || stored === "hi" || stored === "pa") {
        setUiLang(stored);
        uiLangRef.current = stored;
        persistLang(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const changeLang = (lang: UiLang) => {
    setUiLang(lang);
    uiLangRef.current = lang;
    persistLang(lang);
    // Re-render server components (nav slot etc.) with the new cookie.
    router.refresh();
  };

  // Edit mode: remember which shop we're editing so publish() updates it
  // (via logged-in ownership — no edit token) rather than creating a new one.
  useEffect(() => {
    if (initialSlug) {
      publishedSlugRef.current = initialSlug;
      setPublicUrl(`${window.location.origin}/s/${initialSlug}`);
    }
  }, [initialSlug]);

  // Fresh visit to the home page: restore a previously published shop from
  // localStorage so the owner can keep editing it (token-based ownership).
  useEffect(() => {
    if (initialStorefront || initialSlug) return;
    const stored = loadStoredPublish();
    if (!stored) return;
    publishedSlugRef.current = stored.slug;
    publishedTokenRef.current = stored.editToken;
    setStorefront(stored.storefront);
    setPublicUrl(`${window.location.origin}/s/${stored.slug}`);
    setStatus("done");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      streamRef.current.getTracks().forEach((track) => track.stop());
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

  const runStructuring = useCallback(async (text: string, merge: boolean) => {
    setStatus("structuring");
    setError(null);
    lastTranscriptRef.current = text;
    const trNow = t(uiLangRef.current);
    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          existing: merge ? storefrontRef.current : null,
          language: uiLangRef.current,
        }),
      });
      const data = (await res.json()) as StructureResponse;
      if (!res.ok || !data.storefront) {
        setError(data.error ?? trNow.errBuild);
        setStatus(storefrontRef.current ? "done" : "error");
        return;
      }
      setStorefront(data.storefront);
      setPartial(Boolean(data.partial));
      setStatus("done");
    } catch {
      setError(trNow.errNetwork);
      setStatus(storefrontRef.current ? "done" : "error");
    }
  }, []);

  const publish = useCallback(async () => {
    if (!storefrontRef.current) return;
    setPublishing(true);
    setPublishError(null);
    const trNow = t(uiLangRef.current);
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
        setPublishError(data.error ?? trNow.errPublish);
        return;
      }
      publishedSlugRef.current = data.slug;
      publishedTokenRef.current = data.editToken ?? null;
      setPublicUrl(`${window.location.origin}/s/${data.slug}`);

      // Token-owned (anonymous) publishes: persist so a return visit can
      // still edit. Owner-session publishes don't need this.
      if (data.editToken && storefrontRef.current) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              slug: data.slug,
              editToken: data.editToken,
              storefront: storefrontRef.current,
            } satisfies StoredPublish),
          );
        } catch {
          /* storage full/unavailable — non-fatal */
        }
      }
    } catch {
      setPublishError(t(uiLangRef.current).errNetwork);
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
      sessionRef.current = sttRef.current.start(uiToSttLang(uiLang), {
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
              setError(t(uiLangRef.current).errNoSpeech);
            }
          }
        },
        onError: (message) => {
          stopAnalyser();
          setStatus(storefrontRef.current ? "done" : "error");
          const trNow = t(uiLangRef.current);
          setError(
            message === "not-allowed" || message === "service-not-allowed"
              ? trNow.errMic
              : trNow.errStt,
          );
        },
      });
    },
    [uiLang, status, startAnalyser, stopAnalyser, runStructuring],
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
    if (!initialSlug) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  const recording = status === "recording";
  const structuring = status === "structuring";
  const showTyping = typing || !sttSupported;

  const caption = storefrontRef.current ? tr.holdToAddMore : tr.holdToSpeak;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.topRow}>
            <div className={styles.langRow} role="group" aria-label="Language">
              {UI_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={
                    uiLang === l.code ? styles.langChipActive : styles.langChip
                  }
                  aria-pressed={uiLang === l.code}
                  onClick={() => changeLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {nav}
          </div>

          <span className={styles.eyebrow}>
            <span className={styles.dot} />
            BolDukaan
          </span>
          <h1 className={styles.title}>
            {tr.titlePre}
            <span className={styles.amber}>{tr.titleAccent}</span>
            {tr.titlePost}
          </h1>
          <p className={styles.subline}>{tr.subline}</p>

          {!showTyping && (
            <>
              <div
                className={`${styles.voiceWrap} ${recording ? styles.recording : ""}`}
              >
                <div className={`${styles.ring} ${styles.r1}`} />
                <div className={`${styles.ring} ${styles.r2}`} />
                <button
                  type="button"
                  className={styles.voiceBtn}
                  aria-label={caption}
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
                {structuring ? tr.building : caption}
              </p>

              <p className={styles.transcript} aria-live="polite">
                {liveTranscript}
              </p>

              <button
                type="button"
                className={styles.fallbackToggle}
                onClick={() => setTyping(true)}
              >
                {tr.typeInstead}
              </button>
            </>
          )}

          {showTyping && (
            <div className={styles.fallback}>
              {!sttSupported && (
                <p className={styles.statusNote}>{tr.noVoiceInBrowser}</p>
              )}
              <textarea
                className={styles.fallbackArea}
                placeholder={tr.typedPlaceholder}
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
                {structuring ? tr.building : tr.buildMyStorefront}
              </button>
              {sttSupported && (
                <button
                  type="button"
                  className={styles.fallbackToggle}
                  onClick={() => setTyping(false)}
                >
                  {tr.useVoiceInstead}
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
                {tr.yourVoice}
                <span className={styles.arrow}>↓</span>
              </p>
              <div className={styles.reveal} key={JSON.stringify(storefront)}>
                <StorefrontCard storefront={storefront} lang={uiLang} />
              </div>
              {partial && <p className={styles.partialNote}>{tr.partialNote}</p>}

              {publicUrl ? (
                <div className={styles.publishedBox}>
                  <span className={styles.publishedLabel}>{tr.liveAt}</span>
                  <a
                    className={styles.publishedLink}
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {publicUrl}
                  </a>
                  <ShareButton
                    name={storefront.name}
                    url={publicUrl}
                    label={tr.shareOnWhatsApp}
                    shareText={tr.shareText}
                  />
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={publish}
                    disabled={publishing}
                  >
                    {publishing ? tr.updating : tr.updateCta}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={publish}
                  disabled={publishing}
                >
                  {publishing ? tr.publishing : tr.publishCta}
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
                  {tr.startOver}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>
              <p className={styles.placeholderTitle}>{tr.previewTitle}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
