// Stands the engine up and hands control to the game.
//
// Call this once, last thing in the project's entry module, with the game's
// root Entity class. Everything the engine puts on global — the scheduler and
// the timers over it, pause, the picker, the interface — exists from the moment
// it returns, and not before: an entity spawned earlier would run against half
// an engine.

import { Scheduler } from './scheduler.js'
import { Interface } from './interface.js'
import { TweenManager } from './tween.js'
import { Picker } from './picking.js'

export function boot(Main, ...args)
{
	// Pause first. Everything spawned below consults it, some of them from
	// reset, before a frame has had the chance to run.
	global.pause = false
	global.isPaused = function() { return pause }

	global.scheduler = spawnEntity(Scheduler)
	global.setTimeout = function(callback, timeOut) { scheduler.add_task(callback, timeOut || 0) }
	global.sleep = function(timeOut) { return new Promise((resolve) => scheduler.add_task(resolve, timeOut)) }

	spawnEntity(TweenManager)

	global.picker = spawnEntity(Picker)
	global.interface = spawnEntity(Interface)

	return Main ? spawnEntity(Main, ...args) : null
}
