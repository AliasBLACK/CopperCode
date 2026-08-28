import * as Yoga from 'typeflex'
import { Entity } from './entity'

// Constants
const nodePrefab = ccbGetSceneNodeFromName("node")

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
		this.baseNode = Yoga.Node.create()
		this.baseNode.setWidth("100%")
		this.baseNode.setHeight("100%")

		// Get Scene Node.
		this.baseNode.sceneNode = ccbGetSceneNodeFromName("baseNode")
	}

	// Recalculate layout.
	calculateLayout()
	{
		this.baseNode.calculateLayout(
			ccbGetScreenWidth(),
			ccbGetScreenHeight(),
			Yoga.DIRECTION_LTR
		)
		for (let i = 0; i < this.baseNode.getChildCount(); i++)
			this.baseNode.getChild(i).update(0, 0)
	}

	on_update()
	{
		for (let i = 0; i < this.baseNode.getChildCount(); i++) {
			let child = this.baseNode.getChild(i)
			if (!child.hidden && child.checkIfDirtied())
			{
				this.calculateLayout()
				break
			}
		}
	}
}

// Some shared functionality between layout nodes.
class NodeAbstract extends Yoga.Node
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

		// Clone node.
		this.sceneNode = ccbCloneSceneNode(nodePrefab)

        // Redefine setters for builder pattern.
		for (let property in Yoga.Node.prototype)
			if (property.includes("set"))
				this[property] = function(...args)
				{
					Yoga.Node.prototype[property].call(this, ...args)
					return this
				}
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
		if (this.isDirty()) {
			return true
		} else {
			for (let i = 0; i < this.getChildCount(); i++) {
				if (this.getChild(i).checkIfDirtied()) {
					return true
				}
			}
			return false
		}
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
			if (this.originalPositionType !=Yoga.POSITION_TYPE_ABSOLUTE )
				this.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
			this.hidden = true
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
		if (ccbGetSceneNodeProperty(this.sceneNode, "Pos X (pixels)") != left)
			ccbSetSceneNodeProperty(this.sceneNode, "Pos X (pixels)", left)
		if (ccbGetSceneNodeProperty(this.sceneNode, "Pos Y (pixels)") != top)
			ccbSetSceneNodeProperty(this.sceneNode, "Pos Y (pixels)", top)
		if (ccbGetSceneNodeProperty(this.sceneNode, "Width (pixels)") != width)
			ccbSetSceneNodeProperty(this.sceneNode, "Width (pixels)", width)
		if (ccbGetSceneNodeProperty(this.sceneNode, "Height (pixels)") != height)
			ccbSetSceneNodeProperty(this.sceneNode, "Height (pixels)", height)

		// Update children.
		for (let i = 0; i < this.getChildCount(); i++)
		{
			let child = this.getChild(i)
			if (!child.hidden)
				child.update(left, top)
		}
	}
}

export class Node extends NodeAbstract
{
	constructor()
	{
		super()
		this.color = null
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
		}
		return this
	}
}

export class Text extends NodeAbstract
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
        return this
	}

    setText(text)
    {
        ccbSetSceneNodeProperty(this.sceneNode, "Text", text)
		return this
    }

    setTextAlign(align)
    {
        ccbSetSceneNodeProperty(this.sceneNode, "Alignment", align)
		return this
    }
	
	setFont(name, size, style = Text.style.normal, weight = Text.weight.normal, family = Text.family.default)
    {
		ccbSetSceneNodeProperty(this.sceneNode, "Font", `${size}; ${family}; ${name}; ${style}; ${weight}; Not Underlined;`)
		return this
	}

    setColor(color)
    {
        ccbSetSceneNodeProperty(this.sceneNode, "TextColor", color.r, color.g, color.b)
		return this
    }
}