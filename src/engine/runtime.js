// What has to be true of the JavaScript environment before a line of game code
// runs: the shims CopperCube's interpreter needs, and the handful of scene
// nodes everything else looks up by name.
//
// Imported first by index.js, so this module's graph is evaluated before any
// game module body. Nothing here spawns an entity — that is boot.js.

// Keep reference to important nodes.
global.sceneRoot = ccbGetSceneNodeFromName("scene-root")
global.stash = ccbGetSceneNodeFromName("stash")

// Import required libraries.
import 'es5-shim'
import 'es6-shim'
import 'promise-for-es/polyfill'
import './json.js'

// Object.entries and Object.values polyfill.
import * as entries from 'object.entries'
import * as values from 'object.values'
entries.shim()
values.shim()

// Import other files. Order matters: each of these puts something on global
// that the ones after it, or the game, expect to already be there. shims.js is
// first because imported bodies run before this one, and some of them — Oimo's
// prototype wiring — call Object.create while loading. The UI and tween
// modules are pulled in here too so their libraries initialise against the
// untouched Object.create above rather than the shimmed one.
import './shims.js'
import './entity.js'
import './tools.js'
import './physics.js'
import './random.js'
import './localization.js'
import './picking.js'
import './scheduler.js'
import './interface.js'
import './tween.js'
