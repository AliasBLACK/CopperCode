import * as Yoga from 'typeflex'
import { Entity } from './entity'

// Make Yoga available globally
global.Yoga = Yoga

// Constants
const nodePrefab = ccbGetSceneNodeFromName("node")
export const fontMultiplier = ccbGetScreenHeight() / 1080

// Enums
global.renderMode = {
	colorRounded: 0,
	color: 1,
	tiled: 2,
	stretch: 3,
	ninePatch: 4
}
global.textAlign = {
	left: 0,
	right: 1,
	center: 2
}

// Interface runner.
export class Interface extends Entity
{
	constructor()
	{
		// Superclass constructor.
		super()

		// Create base node.
		this.uiRoot = Yoga.Node.create()
		this.uiRoot.setWidth("100%")
		this.uiRoot.setHeight("100%")

		// Get Scene Node.
		this.uiRoot.sceneNode = ccbGetSceneNodeFromName("ui-root")

		this.registerMouseListener()
	}

	// Recalculate layout.
	calculateLayout()
	{
		this.uiRoot.calculateLayout(
			ccbGetScreenWidth(),
			ccbGetScreenHeight(),
			Yoga.DIRECTION_LTR
		)
		for (let i = 0; i < this.uiRoot.getChildCount(); i++)
			this.uiRoot.getChild(i).update(0, 0)
	}

	on_update()
	{
		for (let i = 0; i < this.uiRoot.getChildCount(); i++) {
			let child = this.uiRoot.getChild(i)
			if (!child.hidden && child.checkIfDirtied())
			{
				this.calculateLayout()
				break
			}
		}

		this.updateButtons()
	}

	// Hover is polled every frame — a layout move can slide a button under a
	// pointer that never moved.
	updateButtons()
	{
		const x = ccbGetMousePosX()
		const y = ccbGetMousePosY()

		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i]
			const over = !button.animating &&
				!button.disabled && !button.ignoreMouse && button.over(x, y)

			if (over === button.focus) continue

			button.focus = over

			if (over) {
				button.focusStart()
			} else {
				// Dragging off mid-hold ends the press as a cancelled click.
				if (button.pressed) {
					button.pressed = false
					button.pressMouseLeftEnd()
				}
				button.focusEnd()
			}
		}
	}

	on_mousePress(btn)
	{
		if (btn !== 0) return

		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i]

			if (button.focus && !button.pressed) {
				button.pressed = true
				button.pressMouseLeftStart()
			}
		}
	}

	on_mouseRelease(btn)
	{
		if (btn !== 0) return

		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i]

			if (button.pressed) {
				button.pressed = false
				button.pressMouseLeftEnd()
			}
		}
	}
}

// Some shared functionality between layout nodes.
export class Frame extends Yoga.Node
{
    constructor()
    {
        super()
        this.hidden = false
		this.redirectFocus = null
		this.xOffset = 0
		this.yOffset = 0
		this.animXOffset = 0
		this.animYOffset = 0
		this.animating = false
		this.originalPositionType = Yoga.POSITION_TYPE_ABSOLUTE
		this._left = undefined
		this._top = undefined
		this._width = undefined
		this._height = undefined
		this._dirty = true

		// Clone node.
		this.sceneNode = ccbCloneSceneNode(nodePrefab)
    }

	setChildOf(parent)
	{
		parent.insertChild(this, parent.getChildCount())
		ccbSetSceneNodeParent(this.sceneNode, parent.sceneNode)
		return this
	}

	detach()
	{
		if (this.getParent())
		{
			this.getParent().removeChild(this)
			ccbSetSceneNodeParent(this.sceneNode, stash)
		}
	}

	takeFocus()
	{
		if (this.redirectFocus)
			this.redirectFocus.takeFocus()
	}

	setAnimating(animating)
	{
		this.animating = animating
		for (let i = 0; i < this.getChildCount(); i++)
			this.getChild(i).setAnimating(animating)
	}

    checkIfDirtied() {
		if (this._dirty) {
			this._dirty = false
			return true
		}
		return false
	}

	markLayoutDirty() {
		this._dirty = true
		let parent = this.getParent()
		if (parent && parent.markLayoutDirty)
			parent.markLayoutDirty()
	}

	isHidden()
	{
		let result = this.hidden
		if (!result)
		{
			let parent = this.getParent()
			if (parent && parent.isHidden)
				result = parent.isHidden()
		}
		return result
	}

	hide()
	{
		if (!this.hidden)
		{
			this.originalPositionType = this.getPositionType()
			if (this.originalPositionType != Yoga.POSITION_TYPE_ABSOLUTE)
				this.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			this.hidden = true
			ccbSetSceneNodeProperty(this.sceneNode, "Visible", false)
		}
		return this
	}

	show()
	{
		if (this.hidden)
		{
			if (this.originalPositionType != Yoga.POSITION_TYPE_ABSOLUTE)
				this.setPositionType(this.originalPositionType)
			this.hidden = false
			ccbSetSceneNodeProperty(this.sceneNode, "Visible", true)
		}
		return this
	}

	setAlpha(alpha)
	{
		ccbSetSceneNodeProperty(this.sceneNode, "Alpha", Math.round(alpha * 255))
		return this
	}

	update(xOffset, yOffset)
	{
		// Update self.
		let left = xOffset + this.getComputedLeft()
		let top = yOffset + this.getComputedTop()
		let width = this.getComputedWidth()
		let height = this.getComputedHeight()
		if (this._left !== left)
		{
			this._left = left
			ccbSetSceneNodeProperty(this.sceneNode, "Pos X (pixels)", left)
		}
		if (this._top !== top)
		{
			this._top = top
			ccbSetSceneNodeProperty(this.sceneNode, "Pos Y (pixels)", top)
		}
		if (this._width !== width)
		{
			this._width = width
			ccbSetSceneNodeProperty(this.sceneNode, "Width (pixels)", width)
		}
		if (this._height !== height)
		{
			this._height = height
			ccbSetSceneNodeProperty(this.sceneNode, "Height (pixels)", height)
		}

		// Update children.
		for (let i = 0; i < this.getChildCount(); i++)
		{
			let child = this.getChild(i)
			if (!child.hidden)
				child.update(left, top)
		}
	}
}

// Wrap Yoga setters on prototype for builder pattern (once, not per-instance).
for (let property in Yoga.Node.prototype)
	if (property.includes("set"))
	{
		let original = Yoga.Node.prototype[property]
		Frame.prototype[property] = function(...args)
		{
			original.call(this, ...args)
			this.markLayoutDirty()
			return this
		}
	}

// The conventional suffix each 9-patch cell uses, in layout order.
const ninePatchSuffix = [
	"top_left", "top", "top_right",
	"left",     "center", "right",
	"btm_left", "btm", "btm_right"
]

// Find a slice's authored overlay node, tolerating an optional ".png" in the name.
function findNineNode(name)
{
	let n = ccbGetSceneNodeFromName(name)
	if (!n) n = ccbGetSceneNodeFromName(name + ".png")
	return n
}

export class Panel extends Frame
{
	constructor()
	{
		super()
		this.color = null
		this.alpha = 255
		this.mode = renderMode.color
		this.nineCells = null
		this._nineDirty = false
		return this
	}

	// Switch how the background is drawn: colored rect, single image, or 9-patch.
	setRenderMode(mode, arg)
	{
		this.mode = mode
		if (mode == renderMode.ninePatch)
		{
			this.color = null
			this.setImage(null)
			ccbSetSceneNodeProperty(this.sceneNode, "Draw Background", false)
			this.setNinePatch(arg)
		}
		else
		{
			this.setNinePatchVisible(false)
			if (mode == renderMode.stretch)
			{
				this.setColor(null)
				this.setImage(arg)
			}
			else
			{
				this.setImage(null)
				this.setColor(arg)
			}
		}
		return this
	}

	setColor(color)
	{
		// If no color, turn off rendering.
		if (this.color && !color)
		{
			this.color = null
			ccbSetSceneNodeProperty(this.sceneNode, "Draw Background", false)
		}
		else if (color)
		{
			if (!this.color) ccbSetSceneNodeProperty(this.sceneNode, "Draw Background", true)
			this.color = color
			ccbSetSceneNodeProperty(this.sceneNode, "Background Color", color.r, color.g, color.b)
			ccbSetSceneNodeProperty(this.sceneNode, "Alpha", this.alpha)
		}
		return this
	}

	// Single image stretched over the whole panel.
	setImage(name)
	{
		ccbSetSceneNodeProperty(this.sceneNode, "Image", name || "")
		return this
	}

	// Build the 9 slice nodes from a base name ("blue") or an array of 9 node names.
	setNinePatch(base)
	{
		if (this.nineCells)
			for (let i = 0; i < 9; i++)
				ccbRemoveSceneNode(this.nineCells[i])

		this.nineCells = []
		this.nineSrc = []
		for (let i = 0; i < 9; i++)
		{
			let name = typeof base === "string" ? base + "_" + ninePatchSuffix[i] : base[i]
			let src = findNineNode(name)
			this.nineSrc.push(src)
			let cell = ccbCloneSceneNode(src || nodePrefab)
			ccbSetSceneNodeParent(cell, this.sceneNode)
			this.nineCells.push(cell)
		}
		this.measureNinePatch()
		this.setNinePatchVisible(true)
		this._nineDirty = true
		return this
	}

	// Border thicknesses come from each slice's authored (1080p) size, scaled to the screen.
	measureNinePatch()
	{
		let src = this.nineSrc
		const W = i => src[i] ? ccbGetSceneNodeProperty(src[i], "Width (pixels)") : 0
		const H = i => src[i] ? ccbGetSceneNodeProperty(src[i], "Height (pixels)") : 0
		this.nineLeft  = (W(3) || 42) * fontMultiplier
		this.nineRight = (W(5) || 42) * fontMultiplier
		this.nineTop   = (H(1) || 42) * fontMultiplier
		this.nineBtm   = (H(7) || 42) * fontMultiplier
	}

	setNinePatchVisible(v)
	{
		if (!this.nineCells) return
		for (let i = 0; i < 9; i++)
			ccbSetSceneNodeProperty(this.nineCells[i], "Visible", v)
	}

	setAlpha(alpha)
	{
		this.alpha = alpha
		ccbSetSceneNodeProperty(this.sceneNode, "Alpha", alpha)
		if (this.nineCells)
			for (let i = 0; i < 9; i++)
				ccbSetSceneNodeProperty(this.nineCells[i], "Alpha", alpha)
		return this
	}

	// Reposition the 9 slices whenever the panel's rect changes.
	update(xOffset, yOffset)
	{
		let pl = this._left, pt = this._top, pw = this._width, ph = this._height
		super.update(xOffset, yOffset)
		if (this.nineCells && this.mode == renderMode.ninePatch &&
			(this._nineDirty || this._left !== pl || this._top !== pt || this._width !== pw || this._height !== ph))
		{
			this._nineDirty = false
			this.layoutNinePatch()
		}
	}

	layoutNinePatch()
	{
		let l = this._left || 0, t = this._top || 0, w = this._width || 0, h = this._height || 0
		let lw = this.nineLeft, rw = this.nineRight, th = this.nineTop, bh = this.nineBtm
		let cw = Math.max(0, w - lw - rw), ch = Math.max(0, h - th - bh)
		let x0 = l, x1 = l + lw, x2 = l + lw + cw
		let y0 = t, y1 = t + th, y2 = t + th + ch
		// Stretchable tiles bleed 1px into each neighbour so no seam can show.
		let c = this.nineCells
		this.placeSlice(c[0], x0,     y0,     lw,     th)
		this.placeSlice(c[1], x1 - 1, y0,     cw + 2, th)
		this.placeSlice(c[2], x2,     y0,     rw,     th)
		this.placeSlice(c[3], x0,     y1 - 1, lw,     ch + 2)
		this.placeSlice(c[4], x1 - 1, y1 - 1, cw + 2, ch + 2)
		this.placeSlice(c[5], x2,     y1 - 1, rw,     ch + 2)
		this.placeSlice(c[6], x0,     y2,     lw,     bh)
		this.placeSlice(c[7], x1 - 1, y2,     cw + 2, bh)
		this.placeSlice(c[8], x2,     y2,     rw,     bh)
	}

	placeSlice(node, x, y, w, h)
	{
		ccbSetSceneNodeProperty(node, "Pos X (pixels)", x)
		ccbSetSceneNodeProperty(node, "Pos Y (pixels)", y)
		ccbSetSceneNodeProperty(node, "Width (pixels)", w)
		ccbSetSceneNodeProperty(node, "Height (pixels)", h)
	}
}

export class Text extends Frame
{
	static align = {
		center: "center",
		left: "top left",
		multiLine: "multiline"
	}

	static style = {
		normal: "Normal",
		slant: "Slant",
		italic: "Italic"
	}

	static weight = {
		normal: "Normal",
		thin: "Thin",
		extraLight: "ExtraLight",
		light: "Light",
		medium: "Medium",
		semiBold: "SemiBold",
		bold: "Bold",
		extraBold: "ExtraBold",
		heavy: "Heavy",
		extraHeavy: "ExtraHeavy"
	}

	static family = {
		default: "Default",
		decorative: "Decorative",
		roman: "Roman",
		script: "Script",
		swiss: "Swiss",
		modern: "Modern",
		teletype: "Teletype",
		unknown: "Unknown"
	}

	constructor()
	{
		super()
		ccbSetSceneNodeProperty(this.sceneNode, "Draw Text", true)

		// Set by setDropShadow: a sibling node drawn just under this one.
		this.shadow = null
		this.shadowX = 0
		this.shadowY = 0
		this._text = ""
		this._font = ""
		this._align = ""
        return this
	}

	// A flat copy of the text offset behind it. The shadow is a sibling
	// overlay parented immediately before this node, so it draws underneath;
	// it tracks this node's rect, text, font and visibility from then on.
	setDropShadow(xOffset, yOffset, color = { r: 0, g: 0, b: 0 })
	{
		if (!this.shadow) {
			this.shadow = ccbCloneSceneNode(nodePrefab)
			ccbSetSceneNodeProperty(this.shadow, "Draw Text", true)
			ccbSetSceneNodeProperty(this.shadow, "Draw Background", false)
		}
		this.shadowX = xOffset
		this.shadowY = yOffset
		ccbSetSceneNodeProperty(this.shadow, "TextColor", color.r, color.g, color.b)
		ccbSetSceneNodeProperty(this.shadow, "Text", this._text)
		if (this._font) ccbSetSceneNodeProperty(this.shadow, "Font", this._font)
		if (this._align) ccbSetSceneNodeProperty(this.shadow, "Alignment", this._align)
		ccbSetSceneNodeProperty(this.shadow, "Visible", !this.hidden)

		// Already attached: put the shadow in just before this node so the
		// text stays on top.
		const parent = this.getParent()
		if (parent && parent.sceneNode) {
			ccbSetSceneNodeParent(this.shadow, parent.sceneNode)
			ccbSetSceneNodeParent(this.sceneNode, parent.sceneNode)
		}
		return this
	}

	setChildOf(parent)
	{
		if (this.shadow) ccbSetSceneNodeParent(this.shadow, parent.sceneNode)
		return super.setChildOf(parent)
	}

	detach()
	{
		if (this.shadow) ccbSetSceneNodeParent(this.shadow, stash)
		return super.detach()
	}

	hide()
	{
		if (this.shadow) ccbSetSceneNodeProperty(this.shadow, "Visible", false)
		return super.hide()
	}

	show()
	{
		if (this.shadow) ccbSetSceneNodeProperty(this.shadow, "Visible", true)
		return super.show()
	}

	update(xOffset, yOffset)
	{
		super.update(xOffset, yOffset)
		if (this.shadow && this._left !== undefined) {
			ccbSetSceneNodeProperty(this.shadow, "Pos X (pixels)", this._left + this.shadowX)
			ccbSetSceneNodeProperty(this.shadow, "Pos Y (pixels)", this._top + this.shadowY)
			ccbSetSceneNodeProperty(this.shadow, "Width (pixels)", this._width)
			ccbSetSceneNodeProperty(this.shadow, "Height (pixels)", this._height)
		}
	}

    setText(text)
    {
		this._text = text
        ccbSetSceneNodeProperty(this.sceneNode, "Text", text)
		if (this.shadow) ccbSetSceneNodeProperty(this.shadow, "Text", text)
		return this
    }

    setTextAlign(align)
    {
		this._align = align
        ccbSetSceneNodeProperty(this.sceneNode, "Alignment", align)
		if (this.shadow) ccbSetSceneNodeProperty(this.shadow, "Alignment", align)
		return this
    }

	setFont(name, size, style = Text.style.normal, weight = Text.weight.normal, family = Text.family.default)
    {
		this._font = `${size * fontMultiplier}; ${family}; ${name}; ${style}; ${weight}; Not Underlined;`
		ccbSetSceneNodeProperty(this.sceneNode, "Font", this._font)
		if (this.shadow) ccbSetSceneNodeProperty(this.shadow, "Font", this._font)
		return this
	}

    setColor(color)
    {
        ccbSetSceneNodeProperty(this.sceneNode, "TextColor", color.r, color.g, color.b)
		return this
    }
}

// Every button the mouse can touch; Interface walks it each frame.
const buttons = []

// A panel the pointer can hover and press. Focus follows the pointer; a press
// starts on left-down while focused and ends on release — or cancelled early
// if the pointer drags off mid-hold, in which case focus is already false by
// the time pressMouseLeftEnd runs. Assign action for plain click behaviour.
export class Button extends Panel
{
	constructor()
	{
		super()
		this.focus = false
		this.pressed = false
		this.disabled = false
		this.ignoreMouse = false
		this.action = null
		buttons.push(this)
		return this
	}

	detach()
	{
		this.disableButton()
		super.detach()
		return this
	}

	show()
	{
		if (!buttons.includes(this)) {
			buttons.push(this)
		}
		super.show()
	}

	hide()
	{
		this.disableButton()
		super.hide()
	}

	disableButton()
	{
		const at = buttons.indexOf(this)
		if (at >= 0) {
			buttons[at] = buttons[buttons.length - 1]
			buttons.pop()
		}
	}

	// Whether a screen point lands inside the button's laid-out rect.
	over(x, y)
	{
		return this._left !== undefined &&
			x >= this._left && x < this._left + this._width &&
			y >= this._top && y < this._top + this._height
	}

	// Focus events — the pointer arrived or left.
	focusStart() {}
	focusEnd() {}

	// Press events — left-down on the button, then back up. pressMouseLeftEnd
	// sees focus still true only when the release landed on the button.
	pressMouseLeftStart() {}

	pressMouseLeftEnd()
	{
		if (this.focus && this.action) this.action()
	}
}