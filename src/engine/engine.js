// Keep reference to important nodes.
global.root = ccbGetRootSceneNode()
global.stash = ccbGetSceneNodeFromName("stash")
global.prefabs = ccbGetSceneNodeFromName("prefabs")

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

// Import collision engine.
let Crash = require("crash-colliders")
global.crash = new Crash({ overlapLimit: .01 })
crash.onCollision((a, b, res, cancel) => { a.data?.on_collision(b, res, cancel) })

// 2D Vector class from collision engine.
global.Vec2 = Crash.Vector
Vec2.prototype.mult = function(factor) { return this.scale(factor, factor) }

// Import other files.
import './entity.js'
import './tools.js'
import './random.js'
import { Scheduler } from './scheduler.js'
import { Interface } from './interface.js'
import { TweenManager } from './tween.js'

// Scheduler
global.scheduler = spawnEntity(Scheduler)
global.setTimeout = function(callback, timeOut) { scheduler.add_task(callback, timeOut = 0) }
global.sleep = function(timeOut) { return new Promise((resolve) => scheduler.add_task(resolve, timeOut)) }

// Pause.
global.pause = false
global.isPaused = function() { return pause }

// Initiate tween manager.
spawnEntity(TweenManager)

// Initiate user interface.
global.interface = spawnEntity(Interface)

// Initiate main.
import { Main } from '../main.js'
spawnEntity(Main)