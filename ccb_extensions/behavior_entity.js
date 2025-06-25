/*
	<behavior jsname="behavior_entity" description="Entity">
	</behavior>
*/
behavior_entity = function() { this.lastTime = 0; }
behavior_entity.prototype.onAnimate = function(_node, timeMs) { update(timeMs - this.lastTime); this.lastTime = timeMs; }
behavior_entity.prototype.onMouseEvent = function(mouseEvent, mouseWheelDelta)
{
	switch (mouseEvent)
	{
		case 0: mouseMove(); break;
		case 1: mouseWheel(mouseWheelDelta); break;
		default: break;
	}
}