// The Oimo world and its fixed timestep, on global as `Physics`. Frames vary
// but steps are fixed, so tracked bodies blend between their last two step
// positions — everything visual reads at(), never getPosition(). update() is
// called from the frame loop ahead of entities, so a step lands before
// anything reads it.

import { World } from 'oimo'

const TIMESTEP = 1 / 60
const MAX_STEPS = 5

// Well past real — keeps the car from floating on jumps.
const GRAVITY = -24

class OimoPhysics
{
	constructor()
	{
		this.world = new World({
			timestep: TIMESTEP,
			iterations: 8,
			broadphase: 2,
			worldscale: 1,
			gravity: [0, GRAVITY, 0]
		})

		this.pending = 0
		this.tracked = []

		// No statics of its own — the map adds the floor and the obstacles.
	}

	update(delta)
	{
		if (isPaused()) return

		this.pending += delta

		let steps = 0

		while (this.pending >= TIMESTEP && steps < MAX_STEPS)
		{
			this.remember()
			this.world.step()
			this.pending -= TIMESTEP
			steps++
		}

		// A frame too long to clear is written off, not repaid in a burst.
		if (steps === MAX_STEPS) this.pending = 0

		this.blend(this.pending / TIMESTEP)
	}

	// Adds a rigid body to the world.
	add(options) { return this.world.add(options) }

	// Registers a body for interpolation; returns the handle at() reads.
	follow(body)
	{
		const p = body.getPosition()

		const record = {
			body: body,
			fromX: p.x, fromY: p.y, fromZ: p.z,
			at: new Vec3(p.x, p.y, p.z)
		}

		this.tracked.push(record)

		return record
	}

	// The interpolated position; the same object every call — read, don't keep.
	at(record) { return record.at }

	// Where every tracked body sat before the step about to be taken.
	remember()
	{
		for (let i = 0; i < this.tracked.length; ++i)
		{
			const record = this.tracked[i]
			const p = record.body.getPosition()

			record.fromX = p.x
			record.fromY = p.y
			record.fromZ = p.z
		}
	}

	// Blend each body between where it was and is; on a step-less frame alpha alone carries it.
	blend(alpha)
	{
		for (let i = 0; i < this.tracked.length; ++i)
		{
			const record = this.tracked[i]
			const p = record.body.getPosition()

			record.at.x = record.fromX + (p.x - record.fromX) * alpha
			record.at.y = record.fromY + (p.y - record.fromY) * alpha
			record.at.z = record.fromZ + (p.z - record.fromZ) * alpha
		}
	}
}

global.Physics = new OimoPhysics()
