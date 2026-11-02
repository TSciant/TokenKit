// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=550-2962
// source=src/packs/gamepad/tk-gamepad.mjs
// component=tk-guitar
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const strum = instance.getEnum('State', { Idle: '', Strum: ' highlight="strum"' })

export default {
  example: figma.code`<tk-guitar theme="${theme}"${strum} label="Guitar controller"></tk-guitar>`,
  imports: ['import "tokenkit/packs/gamepad/tk-gamepad.mjs"'],
  id: 'tk-guitar',
  metadata: { nestable: false },
}
