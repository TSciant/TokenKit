// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=573-627
// source=src/packs/tv/tk-tv.mjs
// component=tk-tv-sidebar
import figma from 'figma'
const instance = figma.selectedInstance

const theme = instance.getEnum('Theme', { Boosty: 'boosty', Dark: 'dark', Light: 'light' })

export default {
  example: figma.code`<tk-tv-sidebar label="Main menu" theme="${theme}">
  <a href="#home" aria-current="page"><svg aria-hidden="true"><!-- line icon --></svg><span>Home</span></a>
  <a href="#films"><svg aria-hidden="true"></svg><span>Films</span></a>
  <a href="#music"><svg aria-hidden="true"></svg><span>Music</span></a>
  <!-- add collapse for a rail that opens when focus comes in -->
</tk-tv-sidebar>`,
  imports: ['import "tokenkit/packs/tv/tk-tv.mjs"'],
  id: 'tk-tv-sidebar',
  metadata: { nestable: true },
}
