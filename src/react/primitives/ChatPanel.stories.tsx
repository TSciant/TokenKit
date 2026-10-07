import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { ChatPanel, type ChatRespond, type ChatTurn } from "./ChatPanel";
import { Guidance, GuidancePair } from "./Guidance";

/* A scripted responder: no model, just words arriving at a reading pace, so
   the stories show streaming, Stop and the two announcements for real. */
const REPLIES = [
  "A pack is a set of values for the kit's slots: colours, faces, corners and density.\n\nChange the pack and every component changes with it, because no component names a colour of its own.",
  "Start with the Field: a visible label above the control, sized to the answer you expect. A hint says what format you need, and the error says what went wrong and how to fix it.",
  "Measure it rather than trust the arithmetic. The contrast gate renders every text and surface pair in every pack and checks each one.",
];
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Stopped", "AbortError"));
    });
  });

const scripted: ChatRespond = async function* (messages, { signal }) {
  const asked = messages.filter((m) => m.role === "user").length;
  await wait(700, signal);
  for (const word of REPLIES[(asked - 1) % REPLIES.length].split(/(?<= )/)) {
    await wait(45, signal);
    yield word;
  }
};

const failing: ChatRespond = async () => {
  await new Promise((r) => setTimeout(r, 500));
  throw new Error("The assistant didn’t answer in time.");
};

const FRAME = { blockSize: "34rem", inlineSize: "min(100%, 28rem)" } as const;

const meta = {
  title: "04 Primitives/36 Chat panel",
  component: ChatPanel,
  parameters: {
    docs: {
      description: {
        component:
          "A conversation with an assistant, with the assistant left to the product: give it `respond(turns, { signal })`, which returns the reply as a stream of text, and the panel does the rest. While a reply streams, Send becomes Stop, and what had arrived stays, marked as stopped. A screen reader hears \"Answering…\" when the question is sent and the reply once it is finished, not every word. The transcript follows the newest text only while the reader is at its end. A failed reply says so in its place, with Retry. Starter questions are buttons, never the placeholder, and `note` says once, where it stays visible, what the assistant answers from. Use for: an assistant beside a product. Don't use for: messaging between people.",
      },
    },
  },
  argTypes: {
    respond: { control: false },
    assistantName: { control: "text" },
    userName: { control: "text" },
    note: { control: "text" },
    starters: { control: "object" },
    emptyText: { control: "text" },
    defaultTurns: { control: "object" },
    onTurnsChange: { action: "turns" },
    inputLabel: { control: "text" },
    maxChars: { control: "number" },
    logLabel: { control: "text" },
  },
  args: {
    respond: scripted,
    assistantName: "Kit guide",
    note: "Answers from the kit's documentation. It can be wrong; check what matters against the docs.",
    starters: ["What is a pack?", "How should a form field look?", "How is contrast checked?"],
    emptyText: "Ask about the kit: its packs, its components, how it checks itself.",
    maxChars: 500,
  },
  render: (args) => (
    <div style={FRAME}>
      <ChatPanel {...args} />
    </div>
  ),
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const CONVERSATION: ChatTurn[] = [
  { role: "user", content: "What is a pack?" },
  { role: "assistant", content: REPLIES[0] },
  { role: "user", content: "How should a form field look?" },
  { role: "assistant", content: "Start with the Field: a visible label above the control, sized to the answer", status: "stopped" },
  { role: "user", content: "How is contrast checked?" },
  { role: "assistant", content: "", status: "error", error: "The assistant didn’t answer in time." },
];

export const Conversation: Story = {
  parameters: {
    docs: { description: { story: "A conversation in every state a reply can end in: finished, stopped part-way (its text kept and marked), and failed (said in its place, with Retry, the question kept)." } },
  },
  args: { defaultTurns: CONVERSATION },
};

export const Failing: Story = {
  parameters: {
    docs: { description: { story: "A responder that fails. Ask anything: the reply says what went wrong where it would have been, and Retry asks again." } },
  },
  args: { respond: failing, starters: ["Try me"] },
};

/** A short conversation at 448px with no scrolling, for the Figma ChatPanel to be laid over. */
export const OnionSkin: Story = {
  name: "Onion skin (Figma)",
  parameters: {
    docs: { description: { story: "The note, a question with its answer, a second question whose reply failed, and the composer, at 448px and the height they take, for the Figma ChatPanel to be laid over." } },
    onion: { component: "ChatPanel", target: "root", skin: () => "default.png" },
  },
  args: {
    defaultTurns: [
      { role: "user", content: "What is a pack?" },
      { role: "assistant", content: "A set of values for the kit's slots: colours, faces, corners and density. Change the pack and every component changes with it." },
      { role: "user", content: "How is contrast checked?" },
      { role: "assistant", content: "", status: "error", error: "The assistant didn’t answer in time." },
    ],
  },
  render: (args) => (
    <div style={{ inlineSize: 448 }}>
      <ChatPanel {...args} />
    </div>
  ),
};

const ChatRule = ({ title, children }: { title: string; children: ReactNode }) => (
  <section data-shell="stack" data-gap="3">
    <h2 style={{ margin: 0, fontSize: "var(--tk-size-lg)" }}>{title}</h2>
    {children}
  </section>
);

/* The examples are live panels at a fixed height; a Don't is the panel's own
   markup arranged the wrong way, so both sides wear the same pack. */
const SMALL = { blockSize: "28rem" } as const;
const ASKED: ChatTurn[] = [
  { role: "user", content: "What is a pack?" },
  { role: "assistant", content: "A set of values for the kit's slots: colours, faces, corners and density. Change the pack and every component changes with it." },
];
const Turn = ({ role, who, children }: { role: "user" | "assistant"; who?: string; children: ReactNode }) => (
  <div data-tk="chat-message" data-role={role}>
    {who ? <p data-tk="chat-who">{who}</p> : null}
    <p>{children}</p>
  </div>
);
const Mock = ({ children, composer }: { children: ReactNode; composer: ReactNode }) => (
  <section data-tk="chat" style={SMALL}>
    <div data-tk="chat-log" role="log" aria-live="off" aria-label="Conversation" tabIndex={0}>
      {children}
    </div>
    {composer}
  </section>
);
const Waiting = () => (
  <div data-tk="chat-actions">
    <Button size="sm" disabled>
      Send
    </Button>
  </div>
);

/**
 * How to put an assistant beside a product.
 *
 * From the ds-corpus chat panel brief (PatternFly, Paste, Carbon, Salesforce,
 * Microsoft, Atlassian, GOV.UK), in our words, with live ChatPanels so the
 * guidance stays true when ChatPanel changes.
 */
export const UsingChat: Story = {
  name: "Using chat",
  parameters: {
    docs: {
      description: {
        story:
          "The rules for an assistant beside a product, each with its reason, as Do and Don't pairs of live panels. Drawn from the ds-corpus chat panel brief: PatternFly and Carbon on starter prompts and Stop, Paste on failing in place, Carbon, Teams and Atlassian on saying once that answers can be wrong, GOV.UK on naming who is speaking without pictures.",
      },
    },
  },
  render: () => (
    <div data-shell="stack" data-gap="7" style={{ maxInlineSize: "56rem" }}>
      <ChatRule title="Offer questions to start with">
        <GuidancePair>
          <Guidance tone="do" note="Offer up to three questions as buttons while the conversation is empty. They show what the assistant is for, and pressing one asks it.">
            <div style={SMALL}>
              <ChatPanel respond={scripted} assistantName="Kit guide" starters={["What is a pack?", "How is contrast checked?"]} emptyText="Ask about the kit: its packs, its components, how it checks itself." />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't put the suggestion in the placeholder. It vanishes on the first keystroke, it can't be pressed, and it sits where the reader's own question goes.">
            <Mock
              composer={
                <form data-tk="chat-composer">
                  <textarea data-tk="textarea" rows={2} aria-label="Your message" placeholder="Try: what is a pack?" />
                </form>
              }
            >
              <div data-tk="chat-empty" />
            </Mock>
          </Guidance>
        </GuidancePair>
      </ChatRule>

      <ChatRule title="Say once what it answers from">
        <GuidancePair>
          <Guidance tone="do" note="Say once, in the note above the conversation, what the assistant answers from and that it can be wrong. It stays in view, and every reply stays an answer.">
            <div style={SMALL}>
              <ChatPanel respond={scripted} assistantName="Kit guide" note="Answers from the kit's documentation. It can be wrong; check what matters against the docs." defaultTurns={ASKED} />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't open every reply with a disclaimer. Read once, it's useful; read on every answer, it's the part the reader learns to skip, and the answer starts a line later.">
            <Mock composer={<Waiting />}>
              <Turn role="user" who="You">What is a pack?</Turn>
              <Turn role="assistant" who="Kit guide">As an AI assistant, I can make mistakes, so please verify this information. A pack is a set of values for the kit's slots.</Turn>
            </Mock>
          </Guidance>
        </GuidancePair>
      </ChatRule>

      <ChatRule title="Let the reader stop a reply">
        <GuidancePair>
          <Guidance tone="do" note="While a reply arrives, Send becomes Stop. Stopping keeps what had arrived and marks it, so the reader can ask something better without waiting out an answer they don't want.">
            <div style={SMALL}>
              <ChatPanel respond={scripted} assistantName="Kit guide" defaultTurns={[ASKED[0], { role: "assistant", content: "A set of values for the kit's slots: colours, faces", status: "stopped" }]} />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't leave the reader waiting with nothing to press. A disabled Send while a long answer streams means the only way out is to close the panel.">
            <Mock composer={<Waiting />}>
              <Turn role="user" who="You">What is a pack?</Turn>
              <Turn role="assistant" who="Kit guide">A set of values for the kit's slots: colours, faces</Turn>
            </Mock>
          </Guidance>
        </GuidancePair>
      </ChatRule>

      <ChatRule title="Fail in place, with a way to try again">
        <GuidancePair>
          <Guidance tone="do" note="Say what went wrong where the reply would have been, with Retry beside it. The question stays, and asking again is one press.">
            <div style={SMALL}>
              <ChatPanel respond={scripted} assistantName="Kit guide" defaultTurns={[ASKED[0], { role: "assistant", content: "", status: "error", error: "The assistant didn’t answer in time." }]} />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't drop the reply and leave a code by the composer. The question looks unanswered, the message says nothing a reader can act on, and trying again means typing it out again.">
            <Mock composer={<p data-tk="chat-note">Error 504</p>}>
              <Turn role="user" who="You">What is a pack?</Turn>
            </Mock>
          </Guidance>
        </GuidancePair>
      </ChatRule>

      <ChatRule title="Name it as what it is">
        <GuidancePair>
          <Guidance tone="do" note="Give the assistant a name that says it's an assistant (Kit guide, Docs assistant). Readers weigh an answer differently when they know a model wrote it.">
            <div style={SMALL}>
              <ChatPanel respond={scripted} assistantName="Kit guide" defaultTurns={ASKED} />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't give it a person's name. A reader who thinks a colleague answered will trust it like one, and find out otherwise at the worst moment.">
            <Mock composer={<Waiting />}>
              <Turn role="user" who="You">What is a pack?</Turn>
              <Turn role="assistant" who="Sarah">A set of values for the kit's slots: colours, faces, corners and density.</Turn>
            </Mock>
          </Guidance>
        </GuidancePair>
      </ChatRule>

      <ChatRule title="Name each speaker in words">
        <GuidancePair>
          <Guidance tone="do" note="Label every turn with who said it, in text. It reads the same to everyone, in any pack and in forced colours, and a screen reader says it.">
            <div style={SMALL}>
              <ChatPanel respond={scripted} assistantName="Kit guide" defaultTurns={ASKED} />
            </div>
          </Guidance>
          <Guidance tone="dont" note="Don't tell the turns apart by shade alone. Forced colours flatten the shade, a screen reader hears two paragraphs, and the reader has to work out who is talking.">
            <Mock composer={<Waiting />}>
              <Turn role="user">What is a pack?</Turn>
              <Turn role="assistant">A set of values for the kit's slots: colours, faces, corners and density.</Turn>
            </Mock>
          </Guidance>
        </GuidancePair>
      </ChatRule>
    </div>
  ),
};
