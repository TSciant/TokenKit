/* The kit's Storybook reads its sample text in the kit's own voice: pages
   that explain the kit, and pattern stories that keep matching the Figma
   components drawn from them. Imported first in preview.tsx, so the voice is
   set before any story module builds its placeholders. Everything outside
   this Storybook keeps the neutral default (src/lib/token-ipsum.ts). */
import { setIpsumVoice } from "../src/lib/token-ipsum";
import { KIT_VOICE } from "../src/lib/token-ipsum-kit";

setIpsumVoice(KIT_VOICE);
