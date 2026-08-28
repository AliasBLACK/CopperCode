import { Entity } from "./entity"

export const Easing = {
	Back: 0,
	Bounce: 1,
	Circular: 2,
	Cubic: 3,
	Elastic: 4,
	Exponential: 5,
	Quadratic: 6,
	Quartic: 7,
	Quintic: 8,
	Sine: 9,
	Linear: 10
}

let activeTweens = []
let pauseableTick = 0

export class TweenManager extends Entity
{
	on_update(delta)
	{
		if (isPaused()) return
		
		this.updateTweens(activeTweens, pauseableTick)
		pauseableTick += delta
	}

	updateTweens(tweens, tick)
	{
		let ptr = 0;
		for (let i = 0; i < tweens.length; ++i) {
			const tween = tweens[i];

			const len = tween.endTime - tween.startTime;
			const t = (tick - tween.startTime) / len;
			if (t < 1.0) {
				tweens[ptr++] = tween;
				let value = []
				const easerValue = tween.easer(t)
				for (let i = 0; i < tween.targetValues.length; i++) {
					const base = tween.initialValues[i]
					const delta = tween.targetValues[i] - base;
					value.push( easerValue * delta + base);
				}
				tween.assigner(value)
			}
			else {
				tween.assigner(tween.targetValues);
				tween.resolve();
			}
		}
		tweens.length = ptr;
	}
}

export class Tween
{
	constructor(easing = Easing.Sine)
	{
		const easeIn = easing === Easing.Back ? easeInBack
			: easing === Easing.Bounce ? easeInBounce
			: easing === Easing.Circular ? easeInCircular
			: easing === Easing.Cubic ? easeInCubic
			: easing === Easing.Elastic ? easeInElastic
			: easing === Easing.Exponential ? easeInExponential
			: easing === Easing.Quadratic ? easeInQuadratic
			: easing === Easing.Quartic ? easeInQuartic
			: easing === Easing.Quintic ? easeInQuintic
			: easing === Easing.Sine ? easeInSine
			: easeLinear
		const easeOut = (t) => 1.0 - easeIn(1.0 - t)
		const easeInOut = (t) => t < 0.5 ? 0.5 * easeIn(t * 2.0) : 0.5 + 0.5 * easeOut(t * 2.0 - 1.0)
		this.inEaser = easeIn
		this.inOutEaser = easeInOut
		this.outEaser = easeOut
	}

	runTween(initialValues, targetValues, easer, assigner, durationInSeconds)
	{
		const promise = new Promise(resolve => {
			activeTweens.push({
				started: false,
				initialValues,
				targetValues,
				assigner,
				easer,
				startTime: pauseableTick,
				endTime: pauseableTick + durationInSeconds,
				resolve: resolve
			})
		})
		return promise
	}

	async easeIn(initialValues, newValues, assigner, durationInSeconds)
	{
		await this.runTween(initialValues, newValues, this.inEaser, assigner, durationInSeconds);
	}

	async easeInOut(initialValues, newValues, assigner, durationInSeconds)
	{
		await this.runTween(initialValues, newValues, this.inOutEaser, assigner, durationInSeconds);
	}

	async easeOut(initialValues, newValues, assigner, durationInSeconds)
	{
		await this.runTween(initialValues, newValues, this.outEaser, assigner, durationInSeconds);
	}
}

function easeInBack(t)
{
	return t * t * t - t * Math.sin(t * Math.PI);
}

function easeInBounce(t)
{
	t = 1.0 - t;
	const p = t < (1.0 / 2.75) ? 7.5625 * t * t
		: t < (2.0 / 2.75) ? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
		: t < (2.5 / 2.75) ? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
		: 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
	return 1.0 - p;
}

function easeInCircular(t)
{
	return 1.0 - Math.sqrt(1.0 - t * t);
}

function easeInCubic(t)
{
	return t * t * t;
}

function easeInElastic(t)
{
	return Math.sin(t * 7.5 * Math.PI) * 2.0 ** (10 * (t - 1.0));
}

function easeInExponential(t)
{
	return t === 0.0 ? t : 2 ** (10 * (t - 1.0));
}

function easeLinear(t)
{
	return t;
}

function easeInQuadratic(t)
{
	return t * t;
}

function easeInQuartic(t)
{
	return t * t * t * t;
}

function easeInQuintic(t)
{
	return t * t * t * t * t;
}

function easeInSine(t)
{
	return Math.sin((t - 1.0) * Math.PI / 2) + 1.0;
}