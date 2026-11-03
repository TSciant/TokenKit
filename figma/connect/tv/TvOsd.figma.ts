// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=572-507
// source=src/packs/tv/tk-tv.mjs
// component=tk-tv-osd
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const attrs = instance.getEnum('Kind', {
  Volume: 'kind="volume" value="40"',
  Muted: 'kind="volume" value="40" muted',
  'Now playing': 'kind="now-playing" label="Drama" detail="24 of 98 minutes" value="24"',
  Message: 'kind="message" label="Gamepad connected" detail="Press A to select"',
})

export default {
  example: figma.code`<tk-tv-osd slot="overlay" ${attrs} theme="${theme}"></tk-tv-osd>
<!-- osd.show({ kind, value, muted, label, detail }) opens it; it fades after timeout (3000 ms) unless persist -->`,
  imports: ['import "tokenkit/packs/tv/tk-tv.mjs"'],
  id: 'tk-tv-osd',
  metadata: { nestable: true },
}
