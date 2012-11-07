/**
 * gtm.js
 * 
 * Dran n drop geocoding tool customized for geotyping
 *
 * Author:		Sokratis Vidros
 * Date :       6-10-2011
 */

var GtManualTool = GtManualTool || {};

(GtManualTool = function () {
	var draggedObject = null;
	var draggable = null;
	var mouseOffset = null;
	var content = null;

	function keyPress(event) {
		// @TODO
	}

	function mouseMove(event) {
		if (draggedObject) {
			event = event || window.event;
			var mousePosition = getMousePosition(event);
			$(draggedObject).css( {
				'top' : mousePosition.y + 10 + 'px',
				'left' : mousePosition.x + 10 + 'px'
			});
		}
	}

	function mouseUp(event) {
		Geotyping.clearSelection();
		GtManualTool.hide();
	}

	function getMousePosition(event) {
		if (event.pageX || event.pageY) {
			return {
				x : event.pageX,
				y : event.pageY
			};
		}
		return {
			x : (event.clientX + document.body.scrollLeft - document.body.clientLeft),
			y : (event.clientY + document.body.scrollTop - document.body.clientTop)
		};
	}

	function getMouseOffset(target, event) {
		event = event || window.event;

		var objectPosition = getObjectPosition(target);
		var mousePosition = getMousePosition(event);
		return {
			x : mousePosition.x - objectPosition.x,
			y : mousePosition.y - objectPosition.y
		};
	}

	function getObjectPosition(event) {
		var left = 0;
		var top = 0;

		while (event.offsetParent) {
			left += event.offsetLeft;
			top += event.offsetTop;
			event = event.offsetParent;
		}

		left += event.offsetLeft;
		top += event.offsetTop;

		return {
			x : left,
			y : top
		};
	}

	return ({
		init : function () {
			var gtmDiv = $('<div id="gtmTool"/>');
			$('body').append(gtmDiv);
			draggable = $(gtmDiv).get();
			$(draggable).mouseover(function (event) {
				if (draggedObject) {
					return;
				}
				
				$(this).css({
					'background-color' : '#ff0',
					'cursor' : 'pointer',
					'position' : 'absolute'
				});
			});
			$(draggable).mouseout(function (event) {
				$(this).css({
					'background-color' : '#fff',
					'cursor' : 'auto'
				});
			});
		},
		getContent : function () {
			return content;
		},
		setContent : function (text) {
			content = text;
		},
		hide : function () {
			$(draggable).hide();
			$(document).unbind('mouseup');
			$(document).unbind('mousemove');
			$(document).unbind('keypress');
			content = null;
			draggedObject = null;
			Geotyping.clearSelection();
		},
		show : function (position, text) {
			if (!text)
				return;

			if ($(draggable).is(":visible")) {
				return;
			}	

			content = text;
			var displayedText = content.length < 10 ? content : (content
					.substring(0, 10) + '...');
			$(draggable).css({
				left : position.x + 'px',
				top : position.y + 'px',
				'z-index ' : 10000
			}).html('<p> Locate on the map: </p>' + displayedText).fadeIn('fast');
			draggedObject = draggable;
			// mouseOffset = getMouseOffset(this, event);

			$(document).bind({
				'mouseup' : mouseUp,
				'mousemove' : mouseMove,
				'keypress' : keyPress
			});
			//Geotyping.blur();
			//$(document).focus();
		},
		isVisible : function () {
			return draggedObject ? true : false;
		},
		moveInsideEditor : function (position) {
			if (draggedObject) {
				$(draggedObject).css({
					'top' : position.y + 10 + 'px',
					'left' : position.x + 10 + 'px'
				});
			}
		},
		reset : function(e) {
			// @TODO
		}
	});
}());
