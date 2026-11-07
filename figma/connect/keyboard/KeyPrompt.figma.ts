// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=562-177
// source=src/packs/keyboard/tk-keyboard.mjs
// component=tk-key-prompt
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const lit = instance.getEnum('State', { Off: '', Lit: ' lit' })
const effectText = instance.findText('effect')?.textContent ?? ''
const effect = effectText ? ` effect="${effectText}"` : ''
const action = instance.findText('action')?.textContent ?? 'Move forward'

export default {
  example: figma.code`<tk-key-prompt key="KeyW" action="${action}"${effect} theme="${theme}"${lit}></tk-key-prompt>`,
  imports: ['import "tokenkit/packs/keyboard/tk-keyboard.mjs"'],
  id: 'tk-key-prompt',
  metadata: { nestable: true },
}
