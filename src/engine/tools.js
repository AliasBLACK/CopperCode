// Oimo's Vec3 is structurally identical to CopperCube's vector3d ({x,y,z});
// no scene API takes a vector object, so it can serve as Vec3 everywhere.
import { Vec3 } from 'oimo'
global.Vec3 = Vec3

// Euler rotation in place — CopperCube's X→Y→Z order. Returns this.
Vec3.prototype.rotate = function(rx, ry, rz) {
	const cx = Math.cos(rx), sx = Math.sin(rx)
	const cy = Math.cos(ry), sy = Math.sin(ry)
	const cz = Math.cos(rz), sz = Math.sin(rz)
	let y = this.y * cx - this.z * sx
	let z = this.y * sx + this.z * cx
	let x = this.x * cy + z * sy
	z = -this.x * sy + z * cy
	this.x = x * cz - y * sz
	this.y = x * sz + y * cz
	this.z = z
	return this
}

// Degrees to radians.
global.DEG = Math.PI / 180

global.clamp = function(v, low, high) { return v < low ? low : v > high ? high : v }

// Shallow copy: base with over's keys.
global.merge = function(base, over)
{
	const out = {}
	for (const key in base) out[key] = base[key]
	for (const key in over) out[key] = over[key]
	return out
}

// Angle to minus from, wrapped to +-180.
global.angleTo = function(from, to)
{
	let d = (to - from) % 360
	if (d > 180) d -= 360
	if (d < -180) d += 360
	return d
}

// Frame-rate independent lerp: same fraction per second, not per frame.
global.smooth = function(current, target, rate, delta)
{
	return current + (target - current) * (1 - Math.exp(-rate * delta))
}

// The same, around the circle, so 350 degrees lerps to 10 the short way.
global.smoothAngle = function(current, target, rate, delta)
{
	return current + angleTo(current, target) * (1 - Math.exp(-rate * delta))
}

// Mouseover detection.
global.getMouse3DPos = function() { return ccbGet3DPosFrom2DPos(ccbGetMousePosX(), ccbGetMousePosY()) }

// Console and logging. Write-through: no exit hook exists to flush a buffer
// on, so every line lands in the file immediately, even on a crash.
var logContent = ""
global.console = {
	log: function(str) {
		logContent += str + "\n"
		ccbWriteFileContent("console.log", logContent)
		print(str)
	},
	flush: function() {}
}

// Iterator for child nodes.
global.forEachNode = function(node, func)
{
	let i = ccbGetSceneNodeChildCount(node)
	while (i--) func(ccbGetChildSceneNode(node, i))
}

// Find child node that returns true for func.
global.findNode = function(node, func)
{
	let i = ccbGetSceneNodeChildCount(node)
	let result = null
	while (i-- && result == null)
	{
		let r = ccbGetChildSceneNode(node, i)
		result = func(r) ? r : null
	}
	return result
}

// First child named so, or null.
global.childNamed = function(node, name)
{
	return findNode(node, function(child) { return ccbGetSceneNodeProperty(child, "Name") === name })
}

// Every material slot across a node and its children, as [node, index, authoredType] triples.
global.collectSlots = function(node, into)
{
	const count = ccbGetSceneNodeMaterialCount(node)

	for (let i = 0; i < count; i++)
		into.push(node, i, ccbGetSceneNodeMaterialProperty(node, i, "Type"))

	forEachNode(node, function(child) { collectSlots(child, into) })
}