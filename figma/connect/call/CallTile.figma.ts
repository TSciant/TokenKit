// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=577-167
// source=src/packs/call/Call.tsx
// component=CallTile
// The call pack is React only, so this snippet is JSX although figma.config.json labels the set "Web Components"
// (language html): the config takes one label and language for every template, and this is a raw figma.code
// template, so the JSX is shown as written.
import figma from 'figma'
const instance = figma.selectedInstance

const name = instance.getString('Name')
const props = instance.getEnum('State', {
  Live: 'stream={stream}',
  'Camera off': 'stream={stream} off',
  Connecting: 'stream={null}',
})

export default {
  example: figma.code`<CallTile ${props} name="${name}" />
{/* your own tile: muted mirrored; <CallTiles state={state} /> draws everyone, you first */}`,
  imports: ['import { CallTile } from "tokenkit/packs/call"'],
  id: 'CallTile',
  metadata: { nestable: true },
}
