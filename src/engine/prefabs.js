// Prefab collections: what a thing might be built from, and which way round.
//
// An entry is either a node name on its own, or a name paired with the turns
// it may be stood at, in degrees about the upright axis:
//
//     [["trees_001"], ["trees_002", [90]]]
//
// Zero is always on offer alongside whatever is listed, so trees_002 above
// faces either its authored way or a quarter turn from it. A plain string
// entry is a collection that never turns, and reads the same as it always did.

// Handed back by reference: a pick happens for every feature the map lays
// down, and there are thousands of those.
const pick = { name: "", turn: 0 }

export function pickPrefab(collection)
{
	const entry = Random.sample(collection)

	pick.turn = 0

	if (typeof entry === "string") {
		pick.name = entry
		return pick
	}

	pick.name = entry[0]

	const turns = entry[1]

	if (turns && turns.length) {
		// One of the turns listed, or none of them.
		const at = Random.discrete(0, turns.length)

		if (at > 0) pick.turn = turns[at - 1]
	}

	return pick
}

// Turns a node about the upright axis, keeping whatever tilt it was authored
// with — a mesh out of an FBX often needs one to lie down at all.
export function turnPrefab(node, turn)
{
	if (!turn) return

	const at = ccbGetSceneNodeProperty(node, "Rotation")

	ccbSetSceneNodeProperty(node, "Rotation", at.x, at.y + turn, at.z)
}
