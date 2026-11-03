// url=https://www.figma.com/design/QZCC8HtLON5aYIAmYc56Li/?node-id=568-207
// source=src/packs/tv/tk-tv.mjs
// component=tk-tv-tile
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('Label')
const sub = instance.getString('Sub')
const badge = instance.getBoolean('Badge') ? ` badge="${instance.getString('Badge text')}"` : ''
const focused = instance.getEnum('State', { Default: '', Focused: ' focused' })

// The accent is the instance's tk-tv-accent mode (emerald / violet / amber / cyan / pink), which a template
// cannot read: set accent to match. The theme comes from the shell around the tile.
export default {
  example: figma.code`<tk-tv-tile label="${label}" sub="${sub}" accent="violet"${badge}${focused}></tk-tv-tile>`,
  imports: ['import "tokenkit/packs/tv/tk-tv.mjs"'],
  id: 'tk-tv-tile',
  metadata: { nestable: true },
}
