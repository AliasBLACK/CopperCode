import { Entity } from "./entity";

const playerNode = ccbGetSceneNodeFromName("player")
const gravity = 2
const walkSpeed = 1
const jumpSpeed = 1

const action = {
	climb: 0,
	crouch: 1,
	left: 2,
	right: 3,
	jump: 4
}

const keycodeToAction = function(keycode)
{
	switch(keycode)
	{
		case 87:
			return action.climb

		case 83:
			return action.crouch

		case 65:
			return action.left

		case 68:
			return action.right
		
		case 32:
			return action.jump
	}
}

export class Player extends Entity
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Declare class vars.
		this.active = false
		this.onFloor = false
		this.velocity = new Vec2(0, 0)
		this.roundedPos = new Vec2(0, 0)

		// Controls.
		this.keylog = []
		this.currentPressed = Array(Object.keys(action).length).fill(false)
		this.horizontalMovement = 0
		this.crouch = false

		// Register for keyboard listener.
		this.registerKeyboardListener()

		// Create collider.
		let colliderNode = ccbGetSceneNodeFromName("playerCollider")
		let colliderScale = ccbGetSceneNodeProperty(colliderNode, "Scale")
		this.colliderOffset = new Vec2(colliderScale.x * 5, colliderScale.y * 5)
		this.collider = new crash.Box(new Vec2(0, 0), colliderScale.x * 10, colliderScale.y * 10).setData(this)
	}

	on_keyPress(keycode)
	{
		// Get key.
		let act = keycodeToAction(keycode)

		// Check if key is already pressed.
		if (this.currentPressed[act]) return

		// Set key to pressed.
		this.currentPressed[act] = true

		// Parse movement.
		switch(act)
		{
			case action.left:
				this.horizontalMovement -= 1
				break
			
			case action.right:
				this.horizontalMovement += 1
				break
			
			case action.jump:
				if (this.onFloor) this.velocity.y += jumpSpeed
				break
		}

		// Push key to keylog.
		this.keylog.push(act)

		// If keylog length is the same after .2 seconds, clear it.
		let len = this.keylog.length
		sleep(.2).then(() => { if (this.keylog.length == len) this.keylog = [] })
	}

	on_keyRelease(keycode)
	{
		// Get key.
		let act = keycodeToAction(keycode)

		// Make sure current key is pressed.
		if (!this.currentPressed[act]) return

		// Set key to released.
		this.currentPressed[act] = false

		// Parse movement.
		switch(act)
		{
			case action.left:
				this.horizontalMovement += 1
				break
			
			case action.right:
				this.horizontalMovement -= 1
				break
		}
	}

	spawn(x, y)
	{
		this.active = true

		// Activate collision.
		crash.insert(this.collider)
		this.collider.moveTo(x - this.colliderOffset.x, y - this.colliderOffset.y)

		// Start rendering.
		ccbSetSceneNodeParent(playerNode, root)
	}

	despawn()
	{
		this.active = false

		// Deactivate collision.
		crash.remove(this.collider)

		// Stop rendering.
		ccbSetSceneNodeParent(playerNode, prefabs)
	}

	on_update(delta)
	{
		if (this.active && !isPaused())
		{
			// Gravity and velocity.
			this.velocity.x = walkSpeed * this.horizontalMovement
			this.velocity.y -= gravity * delta
			this.collider.moveBy(this.velocity.x, this.velocity.y)

			// Test collision.
			this.onFloor = false
			crash.testAll(this.collider)

			// Update visuals.
			this.roundedPos.x = Math.round((this.collider.pos.x + this.colliderOffset.x) * 100) / 100
			this.roundedPos.y = Math.round((this.collider.pos.y + this.colliderOffset.y) * 100) / 100
			ccbSetSceneNodeProperty(playerNode, "Position", this.roundedPos.x, this.roundedPos.y, 0)

			// Update camera.
			camera.moveCamera(this.roundedPos)
		}
	}

	on_collision(other, coldata, cancel)
	{
		// On floor?
		this.onFloor = coldata.overlapV.y < 0
		
		// Adjust position.
		this.collider.moveBy(-coldata.overlapV.x, -coldata.overlapV.y)

		// Adjust velocity.		
		if (coldata.overlapV.x != 0)
			if (Math.sign(coldata.overlapV.x) == Math.sign(this.velocity.x)) this.velocity.x = 0
		if (coldata.overlapV.y != 0)
			if (Math.sign(coldata.overlapV.y) == Math.sign(this.velocity.y)) this.velocity.y = 0

		// Abort further checks.
		cancel()
	}
}