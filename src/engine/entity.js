// Collections.
global.runningEntities = []
global.keyboardListeners = []
global.mouseListeners = []
global.hoverListeners = []

// Every pool handed out so far, for profiling.
global.entityPools = []

// Suspended entities wait in a pool hung off their own class. Keying on the class
// itself matters: the minifier renames every class to the same short name, so a
// pool keyed on the name would hand an Orc out where a Tower was asked for.
function poolOf(classObject)
{
	// An own property, or a subclass would inherit and share its parent's pool.
	if (!Object.prototype.hasOwnProperty.call(classObject, "entityPool"))
	{
		classObject.entityPool = []
		entityPools.push(classObject.entityPool)
	}

	return classObject.entityPool
}

// Keyboard events.
global.keyPressed = function(key) { let i = keyboardListeners.length; while (i--) keyboardListeners[i].on_keyPress(key) }
global.keyReleased = function(key) { let i = keyboardListeners.length; while (i--) keyboardListeners[i].on_keyRelease(key) }

// Mouse events.
global.mousePressed = function(btn) { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mousePress(btn) }
global.mouseReleased = function(btn) { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mouseRelease(btn) }
global.mouseWheel = function(delta) { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mouseWheel(delta) }
global.mouseMove = function() { let i = mouseListeners.length; while (i--) mouseListeners[i].on_mouseMove() }

// Game loop.
global.update = function(delta)
{
	delta /= 1000
	let i = runningEntities.length
	while(i--)
	{
		let entity = runningEntities[i]
		if (entity.suspended)
		{
			// Entities built with new, outside spawnEntity, have no pool to wait in.
			if (entity.pool) entity.pool.push(entity)
			runningEntities[i] = runningEntities[runningEntities.length - 1]
			runningEntities.pop()
			continue
		}
		if (entity.on_update !== Entity.prototype.on_update)
			entity.on_update(delta)
	}
}

// Create entity.
global.spawnEntity = function(classObject, ...args)
{
	let pool = poolOf(classObject)
	let entity = pool.length > 0 ? pool.pop() : new classObject()

	// Remembered on the instance, so waking it never looks the class up again.
	entity.pool = pool
	entity.suspended = false
	entity.reset(...args)
	runningEntities.push(entity)

	return entity
}

// Register events.
ccbRegisterKeyDownEvent("keyPressed")
ccbRegisterKeyUpEvent("keyReleased")
ccbRegisterMouseDownEvent("mousePressed");
ccbRegisterMouseUpEvent("mouseReleased");

export class Entity
{
	constructor() { this.suspended = false; this.hoverNode = null }
	suspend() { this.suspended = true; this.removeHoverListener(); this.on_suspend() }
	registerKeyboardListener() { keyboardListeners.push(this) }
	registerMouseListener() { mouseListeners.push(this) }
	removeKeyboardListener() { keyboardListeners[keyboardListeners.indexOf(this)] = keyboardListeners[keyboardListeners.length - 1]; keyboardListeners.pop() }
	removeMouseListener() { mouseListeners[mouseListeners.indexOf(this)] = mouseListeners[mouseListeners.length - 1]; mouseListeners.pop() }

	// Asks the picker to test this entity against the mouse ray each frame.
	// Idempotent, unlike the listeners above: an entity out of a pool runs its
	// reset again and would otherwise be tested, and hovered, twice over.
	registerHoverListener() { if (hoverListeners.indexOf(this) < 0) hoverListeners.push(this) }
	removeHoverListener()
	{
		const at = hoverListeners.indexOf(this)
		if (at < 0) return
		hoverListeners[at] = hoverListeners[hoverListeners.length - 1]
		hoverListeners.pop()
		if (global.picker) picker.release(this)
	}

	// Overridable functions.
	reset(...args) {}
	on_suspend() {}
	on_update(delta) {}
	on_keyPress(key) {}
	on_keyRelease(key) {}
	on_mousePress(btn) {}
	on_mouseRelease(btn) {}
	on_mouseWheel(delta) {}
	on_mouseMove() {}

	// Whether the mouse ray is on this entity. Set hoverNode to have its bounds,
	// and those of everything under it, tested; override for anything else.
	on_hoverTest() { return this.hoverNode !== null && hitsNode(this.hoverNode) }
	on_hoverStart() {}
	on_hoverEnd() {}
}