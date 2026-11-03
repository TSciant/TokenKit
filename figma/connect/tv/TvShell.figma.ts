// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=575-1686
// source=src/packs/tv/tk-tv.mjs
// component=tk-tv-shell
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })
const guides = instance.getEnum('Guides', { Off: '', On: ' guides' })

export default {
  example: figma.code`<tk-tv-shell theme="${theme}" label="TV home" input="keys pad" screen${guides}>
  <tk-tv-sidebar label="Main menu"><!-- links, the open one aria-current="page" --></tk-tv-sidebar>
  <tk-tv-row label="Films"><!-- tk-tv-tile … --></tk-tv-row>
  <tk-tv-row label="Music"><!-- tk-tv-tile … --></tk-tv-row>
  <tk-tv-osd slot="overlay" kind="now-playing"></tk-tv-osd>
</tk-tv-shell>
<!-- events: tk-tv-verb (cancelable), tk-tv-select, tk-tv-exit; shell.press(verb, dir) from an on-screen remote -->`,
  imports: ['import "tokenkit/packs/tv/tk-tv.mjs"'],
  id: 'tk-tv-shell',
  metadata: { nestable: false },
}
