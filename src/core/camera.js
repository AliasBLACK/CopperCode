const distanceFromPlayer = 65

export class Camera
{
	constructor()
	{
		this.camera = ccbGetSceneNodeFromName("Camera1")
	}

	moveCamera(pos)
	{
		ccbSetSceneNodeProperty(this.camera, "Position", pos.x, pos.y, -distanceFromPlayer)
		ccbSetSceneNodeProperty(this.camera, "Target", pos.x, pos.y, 0)
	}
}