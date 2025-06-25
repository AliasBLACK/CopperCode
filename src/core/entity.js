// Collections.
global.runningEntities = []
global.suspendedEntities = {}
global.keyboardListeners = []
global.mouseListeners = []

// Keyboard events.
global.keyPressed = function(key) { let i = keyboardListeners.length; while (i--) keyboardListeners[i].on_keyPress(key) }
global.keyReleased = function(key) { let i = keyboardListeners.length; while (i--) keyboardListeners[i].on_keyRelease(key) }

// Mouse events.
global.mousePressed = function(btn) { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mousePress(btn) }
global.mouseReleased = function(btn) { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mouseRelease(btn) }
global.mouseWheel = function(delta) { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mouseWheel(delta) }
global.mouseMove = function() { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mouseMove() }

// Game loop.
global.render = function() { let i = runningEntities.length; while (i--) runningEntities[i].on_render() }
global.update = function(delta)
{
	delta /= 1000
	let i = runningEntities.length
	while(i--)
	{
		let entity = runningEntities[i]
		if (entity.suspend)
		{
			suspendedEntities[entity.constructor.name].push(entity)
			runningEntities[i] = runningEntities[runningEntities.length - 1]
			runningEntities.pop()
			continue
		}
		entity.on_update(delta)
	}
}

// Create entity.
global.spawnEntity = function(classObject, ...args)
{
	let className = classObject.name
	suspendedEntities[className] = suspendedEntities[className] || []
	let entity = suspendedEntities[className].length > 0 ?
		suspendedEntities[className].pop() :
		new classObject()
	entity.reset(...args)
	runningEntities.push(entity)

	return entity
}

// Register events.
ccbRegisterKeyDownEvent("keyPressed")
ccbRegisterKeyUpEvent("keyReleased")
ccbRegisterMouseDownEvent("mousePressed");
ccbRegisterMouseUpEvent("mouseReleased");
ccbRegisterOnFrameEvent(render)

export class Entity
{
	constructor() { this.suspend = false }
	suspend() { this.suspend = true; this.on_suspend() }
	registerKeyboardListener() { keyboardListeners.push(this) }
	registerMouseListener() { mouseListeners.push(this) }

	// Overridable functions.
	reset(...args) {}
	on_suspend() {}
	on_update(delta) {}
	on_render() {}
	on_keyPress(key) {}
	on_keyRelease(key) {}
	on_mousePress(btn) {}
	on_mouseRelease(btn) {}
	on_mouseWheel(delta) {}
	on_mouseMove() {}
}