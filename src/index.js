// Entry point. Importing the engine installs the runtime, importing main.js
// loads the game's own modules against it, and boot() starts the frame.
//
// Keep the engine import first: game modules run their bodies as they load,
// and those bodies expect the shims and globals to already be in place.

import { boot } from './engine/index.js'
import { Main } from './main.js'

boot(Main)
