// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=571-465
// source=src/packs/tv/tk-tv.mjs
// component=tk-tv-row
import figma from 'figma'
const instance = figma.selectedInstance

const title = instance.getString('Title')

export default {
  example: figma.code`<tk-tv-row label="${title}">
  <tk-tv-tile label="Drama" sub="Slow evenings" accent="violet"></tk-tv-tile>
  <tk-tv-tile label="Comedy" sub="Something light" accent="amber" badge="New"></tk-tv-tile>
  <!-- one tk-tv-tile per tile; the row scrolls sideways to keep focus in view -->
</tk-tv-row>`,
  imports: ['import "tokenkit/packs/tv/tk-tv.mjs"'],
  id: 'tk-tv-row',
  metadata: { nestable: true },
}
