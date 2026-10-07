import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Field } from "./Field";

/** One turn of a conversation. `status` is set on a reply that did not finish. */
export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  status?: "stopped" | "error";
  /** What went wrong, on a reply whose status is "error". */
  error?: string;
};

/**
 * The product's side of the conversation: given the turns so far (the last
 * is the reader's), return the reply, as a stream of text (each chunk is
 * added to what came before) or all at once. Abort when `signal` fires: the
 * reader pressed Stop.
 */
export type ChatRespond = (
  messages: ChatTurn[],
  options: { signal: AbortSignal },
) => AsyncIterable<string> | Promise<string>;

export interface ChatPanelProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  /** Where replies come from. The kit attaches no model, endpoint or prompt. */
  respond: ChatRespond;
  /** The assistant's name, shown on every reply. Name it as what it is. */
  assistantName?: string;
  /** The reader's label on their own turns. */
  userName?: string;
  /**
   * What the assistant answers from and how far to trust it, said once and
   * kept in view, rather than as a disclaimer opening every reply.
   */
  note?: ReactNode;
  /** Up to three questions to start with, shown while the conversation is empty. */
  starters?: string[];
  /** What the empty conversation says before anything is asked. */
  emptyText?: ReactNode;
  /** The conversation to start from (uncontrolled); keep it with `onTurnsChange`. */
  defaultTurns?: ChatTurn[];
  /** Every change to the conversation, for a product that keeps it somewhere. */
  onTurnsChange?: (turns: ChatTurn[]) => void;
  /** The composer's label. */
  inputLabel?: string;
  /** A limit on what the reader can send, shown as a count under the composer. */
  maxChars?: number;
  /** The transcript's accessible name. */
  logLabel?: string;
}

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

/**
 * ChatPanel — a conversation with an assistant, with the assistant left to the
 * product: a transcript, a composer and a reply that streams in.
 *
 * While a reply streams, Send becomes Stop; what had arrived stays, marked
 * as stopped. A screen reader hears two things, not every word: "Answering…"
 * when the question is sent, and the reply once it is finished. The
 * transcript follows the newest text only while the reader is at its end;
 * scrolled up, it stays where they are. A reply that fails says so in its
 * place, with Retry. Starter questions are buttons, not a placeholder.
 */
export function ChatPanel({
  respond,
  assistantName = "Assistant",
  userName = "You",
  note,
  starters = [],
  emptyText = "Ask a question to start.",
  defaultTurns = [],
  onTurnsChange,
  inputLabel = "Your message",
  maxChars,
  logLabel = "Conversation",
  ...rest
}: ChatPanelProps) {
  const [turns, setTurnsState] = useState<ChatTurn[]>(defaultTurns);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [composerKey, setComposerKey] = useState(0);
  const panel = useRef<HTMLElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const atEnd = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const turnsRef = useRef(turns);

  const setTurns = (next: ChatTurn[]) => {
    turnsRef.current = next;
    setTurnsState(next);
    onTurnsChange?.(next);
  };

  /* Follow the newest text only while the reader is already at the end. */
  useLayoutEffect(() => {
    const el = log.current;
    if (el && atEnd.current) el.scrollTop = el.scrollHeight;
  }, [turns]);
  useEffect(() => () => abort.current?.abort(), []);

  const focusComposer = () => panel.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();

  async function ask(history: ChatTurn[]) {
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setAnnounce("Answering…");
    atEnd.current = true;
    let text = "";
    const place = (reply: ChatTurn) => setTurns([...history, reply]);
    place({ role: "assistant", content: "" });
    try {
      const result = respond(history, { signal: controller.signal });
      if (typeof (result as AsyncIterable<string>)[Symbol.asyncIterator] === "function") {
        for await (const chunk of result as AsyncIterable<string>) {
          if (controller.signal.aborted) break;
          text += chunk;
          place({ role: "assistant", content: text });
        }
      } else {
        text = await (result as Promise<string>);
      }
      if (controller.signal.aborted) {
        place({ role: "assistant", content: text, status: "stopped" });
        setAnnounce(text ? `Stopped. ${assistantName} said: ${text}` : "Stopped.");
      } else if (!text.trim()) {
        throw new Error("No answer came back.");
      } else {
        place({ role: "assistant", content: text });
        setAnnounce(`${assistantName} said: ${text}`);
      }
    } catch (e) {
      if (controller.signal.aborted) {
        place({ role: "assistant", content: text, status: "stopped" });
        setAnnounce(text ? `Stopped. ${assistantName} said: ${text}` : "Stopped.");
      } else {
        const message = (e as Error)?.message || "Something went wrong.";
        place({ role: "assistant", content: text, status: "error", error: message });
        setAnnounce(`No answer: ${message}`);
      }
    } finally {
      abort.current = null;
      setBusy(false);
    }
  }

  function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setDraft("");
    setComposerKey((k) => k + 1); // a fresh composer resets its character count
    void ask([...turnsRef.current, { role: "user", content: q }]);
    requestAnimationFrame(focusComposer);
  }

  /* Retry asks the failed reply's question again, from the turns before it. */
  function retry(index: number) {
    if (busy) return;
    void ask(turnsRef.current.slice(0, index));
  }

  const empty = turns.length === 0;
  const streamingIndex = busy ? turns.length - 1 : -1;

  return (
    <section data-tk="chat" ref={panel} {...rest}>
      {note ? <p data-tk="chat-note">{note}</p> : null}

      <div
        data-tk="chat-log"
        ref={log}
        role="log"
        /* Announcements come from the status line below: once when a question
           is sent, once when the reply is finished. Left to the log, a
           streaming reply would be read out chunk by chunk. */
        aria-live="off"
        aria-label={logLabel}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {empty ? (
          <div data-tk="chat-empty">
            <p>{emptyText}</p>
            {starters.length ? (
              <div data-shell="inline" data-gap="2" role="group" aria-label="Questions to start with">
                {starters.slice(0, 3).map((s) => (
                  <Chip key={s} interactive onClick={() => send(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          turns.map((t, i) => (
            <div key={i} data-tk="chat-message" data-role={t.role} aria-busy={i === streamingIndex || undefined}>
              <p data-tk="chat-who">{t.role === "user" ? userName : assistantName}</p>
              {paragraphs(t.content).map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {i === streamingIndex && !t.content ? (
                <p data-tk="chat-pending" aria-hidden="true">
                  Answering…
                </p>
              ) : null}
              {t.status === "stopped" ? <p data-tk="chat-flag">Stopped</p> : null}
              {t.status === "error" ? (
                <Alert status="warning" title="No answer">
                  <p>{t.error}</p>
                  <Button size="sm" variant="outline" onClick={() => retry(i)}>
                    Retry
                  </Button>
                </Alert>
              ) : null}
            </div>
          ))
        )}
      </div>

      <p data-tk="visually-hidden" role="status">
        {announce}
      </p>

      <form
        data-tk="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <Field
          key={composerKey}
          label={inputLabel}
          control="textarea"
          rows={2}
          hint="Enter sends; Shift+Enter starts a new line."
          maxChars={maxChars}
          value={draft}
          onChange={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send(draft);
            }
          }}
        />
        <div data-tk="chat-actions">
          {busy ? (
            <Button type="button" variant="outline" size="sm" onClick={() => abort.current?.abort()}>
              Stop
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Send
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
