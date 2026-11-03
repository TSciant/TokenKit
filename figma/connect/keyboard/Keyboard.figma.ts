// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=561-1503
// source=src/packs/keyboard/tk-keyboard.mjs
// component=tk-keyboard
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const keys = instance.getEnum('Keys', { Default: 'wasd arrows space shift', WASD: 'wasd', Arrows: 'arrows' })
const highlight = instance.getEnum('Keys', { Default: 'KeyW', WASD: 'KeyW', Arrows: 'ArrowUp' })
const state = instance.getEnum('State', { Idle: 'idle', Highlight: 'highlight', Pressed: 'pressed' })
const lit = state === 'highlight' ? ` highlight="${highlight}"` : ''
const held = state === 'pressed' ? `\n<!-- pressed: el.state = { pressed: ["${highlight}"] } -->` : ''

export default {
  example: figma.code`<tk-keyboard keys="${keys}" theme="${theme}"${lit} source="live" label="Keyboard"></tk-keyboard>${held}`,
  imports: ['import "tokenkit/packs/keyboard/tk-keyboard.mjs"'],
  id: 'tk-keyboard',
  metadata: { nestable: false },
}
