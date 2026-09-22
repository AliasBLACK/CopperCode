// What the mouse is pointing at in the world.
//
// The ray is read once a frame, from the camera through the cursor, and every
// query below works off that one reading — a raycast is not cheap, and a frame
// asks for one many times over. Read it again yourself if you need to pick
// something from inside a mouse event, which arrives between frames and so
// sees a ray that is one frame stale.
//
// Entities opt into hovering with registerHoverListener(). The Picker walks
// the listeners once a frame, most recently registered first, and the first
// one the ray touches is hovered; the one before it is let go. Only ever one
// entity at a time, which is what a pointer means.

import { Entity } from './entity.js'

// Where the eye is, and a point far along the line through the cursor.
const from = { x: 0, y: 0, z: 0 }
const along = { x: 0, y: 0, z: 0 }

// Far enough along to cross any scene worth testing against. A bounding box
// test is a segment test, so the segment has to reach past whatever it might hit.
let rayLength = 5000

// For a scene larger than the default reach.
export function setRayLength(length) { rayLength = length }

// Reads the mouse ray for this frame. False if the cursor sits exactly on the
// eye and there is no direction to be had, in which case the previous reading
// is left alone and no query should be trusted.
export function readMouseRay()
{
	const eye = ccbGetSceneNodeProperty(ccbGetActiveCamera(), "Position")
	const at = getMouse3DPos()

	const dx = at.x - eye.x
	const dy = at.y - eye.y
	const dz = at.z - eye.z
	const span = Math.sqrt(dx * dx + dy * dy + dz * dz)

	if (span === 0) return false

	from.x = eye.x
	from.y = eye.y
	from.z = eye.z

	along.x = eye.x + dx / span * rayLength
	along.y = eye.y + dy / span * rayLength
	along.z = eye.z + dz / span * rayLength

	return true
}

// Whether the ray touches a node's bounds, or those of anything under it. A
// mesh out of an FBX is usually a bare parent over the geometry that actually
// has a size, so the children are where the hit is.
export function hitsNode(node)
{
	if (ccbDoesLineCollideWithBoundingBoxOfSceneNode(node,
		from.x, from.y, from.z, along.x, along.y, along.z)) return true

	let i = ccbGetSceneNodeChildCount(node)

	while (i--) if (hitsNode(ccbGetChildSceneNode(node, i))) return true

	return false
}

// Handed back by reference: ground queries happen several times a frame.
const planePoint = { x: 0, y: 0, z: 0 }

// Where the ray crosses a horizontal plane at the given height, or false if it
// runs parallel to the plane or would only meet it behind the camera. The point
// is the same object every call — read it before asking again.
export function rayPlaneHit(height)
{
	const rise = along.y - from.y

	if (rise === 0) return false

	const t = (height - from.y) / rise

	if (t < 0) return false

	planePoint.x = from.x + (along.x - from.x) * t
	planePoint.y = height
	planePoint.z = from.z + (along.z - from.z) * t

	return planePoint
}

// Reachable without importing, in the manner of the rest of the engine, so
// entity.js can default its hover test without importing this module back.
global.readMouseRay = readMouseRay
global.hitsNode = hitsNode
global.rayPlaneHit = rayPlaneHit

// Drives hovering. boot() stands one up as global.picker; a game that wants
// none can suspend it.
export class Picker extends Entity
{
	reset()
	{
		this.hovered = null
	}

	on_update()
	{
		if (isPaused()) return

		// Costs a game that hovers nothing nothing at all — a raycast is not
		// cheap enough to spend on an empty list.
		if (hoverListeners.length === 0) return

		if (!readMouseRay()) return

		this.setHovered(this.topHit())
	}

	// The frontmost listener the ray touches. Registration order stands in for
	// depth: what was put in the scene last is what the hand reaches first.
	topHit()
	{
		let i = hoverListeners.length

		while (i--)
		{
			const listener = hoverListeners[i]

			if (!listener.suspended && listener.on_hoverTest()) return listener
		}

		return null
	}

	setHovered(what)
	{
		if (this.hovered === what) return

		if (this.hovered) this.hovered.on_hoverEnd()

		this.hovered = what

		if (what) what.on_hoverStart()
	}

	// Forgets an entity that went away mid-hover, without telling it so.
	release(entity)
	{
		if (this.hovered === entity) this.hovered = null
	}
}
