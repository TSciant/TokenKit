// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-3149
// source=src/packs/gamepad/tk-gamepad.mjs
// component=tk-button-prompt
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const lit = instance.getEnum('State', { Off: '', Lit: ' lit' })
const action = instance.findText('action')?.textContent ?? 'Fetch'

export default {
  example: figma.code`<tk-button-prompt btn="south" action="${action}" theme="${theme}"${lit} terse></tk-button-prompt>`,
  imports: ['import "tokenkit/packs/gamepad/tk-gamepad.mjs"'],
  id: 'tk-button-prompt',
  metadata: { nestable: true },
}
