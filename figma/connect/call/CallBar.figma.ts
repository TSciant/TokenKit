// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=577-280
// source=src/packs/call/Call.tsx
// component=CallBar
// The call pack is React only, so this snippet is JSX although figma.config.json labels the set "Web Components"
// (language html): the config takes one label and language for every template, and this is a raw figma.code
// template, so the JSX is shown as written.
import figma from 'figma'
const instance = figma.selectedInstance

const mic = instance.getEnum('Mic', { On: 'true', Off: 'false' })
const cam = instance.getEnum('Camera', { On: 'true', Off: 'false' })

export default {
  example: figma.code`const [state, call] = useCall(send) // state.mic is ${mic}, state.cam is ${cam} in this variant
<CallBar state={state} call={call} />`,
  imports: ['import { CallBar, useCall } from "tokenkit/packs/call"'],
  id: 'CallBar',
  metadata: { nestable: true },
}
