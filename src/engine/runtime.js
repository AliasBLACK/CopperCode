// What has to be true of the JavaScript environment before a line of game code
// runs: the shims CopperCube's interpreter needs, the collision engine, the
// vector types, and the handful of scene nodes everything else looks up by name.
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

// Object.create polyfill.
Object.create = function (o) { function f(){}; f.prototype = o; return new f() }

// Array includes polyfill.
Array.prototype.includes = function(item) { return this.indexOf(item) != -1 }

// Import collision engine.
let Crash = require("crash-colliders")
global.crash = new Crash({ overlapLimit: .01 })
crash.onCollision((a, b, res, cancel) => { a.data?.on_collision(b, res, cancel) })

// 2D Vector class from collision engine.
global.Vec2 = Crash.Vector
Vec2.prototype.mult = function(factor) { return this.scale(factor, factor) }

// Import other files. Order matters: each of these puts something on global
// that the ones after it, or the game, expect to already be there. The UI and
// tween modules are pulled in here too so their libraries initialise against
// the untouched Object.create above rather than the shimmed one.
import './entity.js'
import './tools.js'
import './random.js'
import './localization.js'
import './picking.js'
import './scheduler.js'
import './interface.js'
import './tween.js'
