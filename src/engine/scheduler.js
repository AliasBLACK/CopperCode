import { Entity } from "./entity"

export class Scheduler extends Entity
{
	constructor()
	{
		super()
		this.tasks = []
	}

	on_update(delta)
	{
		let i = this.tasks.length
		while (i--)
		{
			let task = this.tasks[i]
			task[1] -= delta
			if (task[1] <= 0)
			{
				task[0]()
				this.tasks[i] = this.tasks[this.tasks.length - 1]
				this.tasks.pop()
			}
		}
	}

	add_task(callback, timeOut)
	{
		this.tasks.push([callback, timeOut])
	}

	clear()
	{
		this.tasks = []
	}
}