// Add additional functions to vector3d.
global.Vec3 = vector3d
Vec3.prototype.mult = function(factor) { return new Vec3(this.x * factor, this.y * factor, this.z * factor) }
Vec3.prototype.reset = function() { this.x = 0; this.y = 0; this.z = 0 }
Vec3.prototype.clone = function() { return new Vec3(this.x, this.y, this.z) }
Vec3.prototype.rotate = function(rx, ry, rz) {
    // Clone the vector
    let x = this.x;
    let y = this.y;
    let z = this.z;

    // Rotate around X-axis
    let cosX = Math.cos(rx);
    let sinX = Math.sin(rx);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;

    // Rotate around Y-axis
    let cosY = Math.cos(ry);
    let sinY = Math.sin(ry);
    let x1 = x * cosY + z * sinY;
    let z2 = -x * sinY + z * cosY;
    x = x1;
    z = z2;

    // Rotate around Z-axis
    let cosZ = Math.cos(rz);
    let sinZ = Math.sin(rz);
    let x2 = x * cosZ - y * sinZ;
    let y2 = x * sinZ + y * cosZ;
    x = x2;
    y = y2;

    return new Vec3(x, y, z);
}

// Mouseover detection.
global.getMouse3DPos = function() { return ccbGet3DPosFrom2DPos(ccbGetMousePosX(), ccbGetMousePosY()) }

// Console and logging.
var log = ""
global.console = {
    log: function(str) {
        log += str + "\n"
        ccbWriteFileContent("console.log", log)
        print(str)
    }
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