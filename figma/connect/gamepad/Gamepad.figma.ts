// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-153
// source=src/packs/gamepad/tk-gamepad.mjs
// component=tk-gamepad
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const glyphs = instance.getEnum('Glyphs', { Letters: 'letters', Shapes: 'shapes', Numbers: 'numbers' })
const highlight = instance.getEnum('State', { Idle: '', Highlight: ' highlight="up"', Pressed: '' })
const pressed = instance.getEnum('State', { Idle: '', Highlight: '', Pressed: '\n<!-- pressed: el.state = { pressed: ["south", "up", "rb"] } -->' })

export default {
  example: figma.code`<tk-gamepad theme="${theme}" glyphs="${glyphs}"${highlight} source="live" label="Controller"></tk-gamepad>${pressed}`,
  imports: ['import "tokenkit/packs/gamepad/tk-gamepad.mjs"'],
  id: 'tk-gamepad',
  metadata: { nestable: false },
}
