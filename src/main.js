// Keep reference to important nodes.
global.root = ccbGetRootSceneNode()
global.stash = ccbGetSceneNodeFromName("stash")
global.prefabs = ccbGetSceneNodeFromName("prefabs")

// Import required libraries.
import 'es5-shim'
import 'es6-shim'
import 'promise-for-es/polyfill'
import './lib/json.js'

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
import './core/entity.js'
import './core/tools.js'
import { Scheduler } from './core/scheduler'
import { Camera } from './core/camera'
import { Interface } from './core/interface'
import { LevelManager } from './core/levelManager.js'
import { Player } from './core/player.js'

// Scheduler
global.scheduler = spawnEntity(Scheduler)
global.setTimeout = function(callback, timeOut) { scheduler.add_task(callback, timeOut = 0) }
global.sleep = function(timeOut) { return new Promise((resolve) => scheduler.add_task(resolve, timeOut)) }

// Pause.
global.pause = false
global.isPaused = function() { return pause }

// Initiate camera controller.
global.camera = new Camera()

// Initiate player object.
global.player = spawnEntity(Player)

// Initiate level manager.
global.levelManager = new LevelManager()
levelManager.load("room_001", "spawn_001")

// Initiate user interface.
global.interface = spawnEntity(Interface)