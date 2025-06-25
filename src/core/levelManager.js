// Parse room node and turn it into room object.
const parseRoom = function(room)
{
	// Parse room data.
	let data = findNode(room, child => ccbGetSceneNodeProperty(child, "Name") == "data")
	let colliders = []
	let spawns = {}
	forEachNode(data, d => {
		switch(ccbGetSceneNodeProperty(d, "Name"))
		{
			case "colliders":
				forEachNode(d, collider => {
					let position = ccbGetSceneNodeProperty(collider, "Position")
					let scale = ccbGetSceneNodeProperty(collider, "Scale")
					position.x -= scale.x * 5
					position.y -= scale.y * 5
					let box = new crash.Box(new Vec2(position.x, position.y), scale.x * 10, scale.y * 10)
					colliders.push(box)
				})
				break
			
			case "spawn":
				forEachNode(d, spawn => {
					let position = ccbGetSceneNodeProperty(spawn, "Position")
					spawns[ccbGetSceneNodeProperty(spawn, "Name")] = new Vec2(position.x, position.y)
				})
				break
		}
	})
	return new Room(room, colliders, spawns)
}

// Cache location of room folder.
const roomFolder = ccbGetSceneNodeFromName("rooms")

// Level Manager object.
export class LevelManager
{
	constructor()
	{
		// Declare variables.
		this.rooms = {}
		this.currentRoom = null

		// Load rooms from ccb file.
		let r = roomFolder
		forEachNode(r, room => {
			this.rooms[ccbGetSceneNodeProperty(room, "Name")] = parseRoom(room)
		})
	}

	load(roomName, spawn = "undefined")
	{
		// If room exists.
		if (roomName in this.rooms)
		{
			// Unload existing room.
			this.unloadCurrentRoom()

			// Load room.
			let room = this.rooms[roomName]
			this.currentRoom = room
			ccbSetSceneNodeParent(room.room, root)
			for (const collider of room.colliders)
				crash.insert(collider)

			// Spawn player.
			let spawnPt
			if (spawn in room.spawns)
				spawnPt = room.spawns[spawn]
			else
			{
				spawnPt = Object.values(room.spawns)[0]
				console.log(`Spawn point "${spawn}" not found in room. Defaulting to first spawn point.`)
			}
			player.spawn(spawnPt.x, spawnPt.y)
		}
		
		// Else, report error.
		else console.log(`${roomName} not found in existing rooms.`)
	}

	unloadCurrentRoom()
	{
		if (this.currentRoom != null)
		{
			ccbSetSceneNodeParent(this.currentRoom.room, roomFolder)
			for (const collider of this.currentRoom.colliders)
				crash.remove(collider)
			this.currentRoom = null
		}
	}
}

// Room object.
export class Room
{
	constructor(room, colliders, spawns)
	{
		this.room = room
		this.colliders = colliders
		this.spawns = spawns
	}
}