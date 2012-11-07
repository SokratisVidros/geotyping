/**
 * highlight.js
 * 
 * Highting jQuery Plugin highlight v3 Highlights arbitrary terms. MIT license.
 * Johann Burkard
 * 
 * Modified for geotyping and CKEditor
 * 
 * Author : 	Sokratis Vidros
 * Date   : 	13-12-2010
 */

(function($) {
	jQuery.fn.highlight = function(pat) {
		function innerHighlight(node, pat) {
			var skip = 0;
			var nodeData;
			var pos;
			/*
			 * log("Type: " + node.nodeType + " Name:" + node.nodeName + "
			 * data:" + (node.data || node.innerHTML));
			 */
			/* Case: Node.TEXT_NODE */
			if (node.nodeType == 3) {
				/*
				 * Escape backslash as it creates conflicts with regular
				 * expressions
				 */
				pat = pat.replace('\\', '');
				nodeData = node.data;

				/*
				 * We need unicode regexp: var regExp = new
				 * RegExp("\\b"+pat+"\\b"); var pos = nodeData.search(regExp);
				 */
				pos = nodeData.search(pat);
				if (pos >= 0) {
					var spanNode = document.createElement('span');
					spanNode.className = 'highlight';
					var middlebit = node.splitText(pos);
					var endbit = middlebit.splitText(pat.length);
					var middleclone = middlebit.cloneNode(true);
					spanNode.appendChild(middleclone);
					middlebit.parentNode.replaceChild(spanNode, middlebit);
					skip = 1;
				}
			} else if (node.nodeType == 1
					&& node.nodeName.toLowerCase() == 'img') {
				pat = pat.replace('\\', '');
				nodeData = node.attributes.alt.value;
				pos = nodeData.search(pat);
				if (pos >= 0) {
					var spanNode = document.createElement('span');
					spanNode.className = 'highlight ghost';
					spanNode.style.cssText = 'display:none;';
					spanNode.innerHTML = pat;
					$(node).after(spanNode);
					// node.parentNode.appendChild(spanNode);
				}
			} else if (node.nodeType == 1 && node.childNodes
					&& !/(script|style)/i.test(node.tagName)
					&& node.className != "highlight"
					&& !$(node).hasClass("highlight")
					&& node.id != "_firebugConsole") {
				for (var i = 0; i < node.childNodes.length; i++) {
					i += innerHighlight(node.childNodes[i], pat);
				}
			}
			return skip;
		}
		return this.each(function() {
			innerHighlight(this, pat);
		});
	};

	jQuery.fn.removeHighlight = function(term) {
		return this.find('span.highlight').each(function () {
			/* FF fix */
			if ($(this).text().length == 0) {
				return;
			}

			/* Remove highlight for a specific term */
			if (term) {
				if ($(this).text() == term) {
					with (this.parentNode) {
						replaceChild(this.firstChild, this);
						normalize();
					}
				}
			}
			/* Remove all highlighting */
			else {
				var parent = this.parentNode;
				parent.replaceChild(this.firstChild, this);
				parent.normalize();
			}
		}).end();
	};

	jQuery.fn.destroyHighlight = function() {
		return this.find('span.highlight').each(function() {
			if ($(this).hasClass('ghost'))
				$(this).remove();
			else
				$(this).css('background-color', '#fff').addClass('invisible');
		}).end();
	};
})(jQuery);