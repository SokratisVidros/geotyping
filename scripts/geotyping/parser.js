/*
 * Geotyping, Live geocoding of free text
 *
 * Filename:        parser.js v 1.0
 * Description:     Internal Parser
 * Author:          Vidros Socratis
 * Date:            10-6-2011
 */

/**
 * parse.js
 * 
 * "Dummy" iterative parser that returns uppercase words.
 *
 * Author:		Sokratis Vidros
 * Date :       6-10-2010
 */

(Parser = function() {
	return ({
		parse : function(text) {
			var sentences = new Array();
			var tokens = new Array();
			var token = '';

			sentences = text.split(/\.|\!|\?|\;/);
			for ( var i = 0; i < sentences.length; i++) {
				/* Trim any spaces at the begging or the end of the sentence */
				sentences[i] = jQuery.trim(sentences[i]);

				/* Split sentences in tokens by spaces */
				var words = sentences[i].split(' ');

				/*
				 * Ignore the first word in a sentence only in Greek but be
				 * aware of spaces after the. Build in RegExps support only Ansi
				 * characters. So matching returns false for greek characters
				 */
				var matchNotGreek = /[A-Z]/;
				var index = 1;
				
				words[0] = jQuery.trim(words[0]);
				
				if (words[0].match(matchNotGreek)) {
					index = 0;
				}

				for ( var j = index; j < words.length; j++) {
					words[j] = jQuery.trim(words[j]);
					var firstChar = words[j].charAt(0);
					// Check if first char is Capitalized
					if (firstChar == firstChar.toUpperCase()) {
						token += words[j] + ' ';
						if (j == words.length - 1) {
							tokens.push(token.substring(0, token.length - 1));
							token = '';
						}
					} else {
						if (token) {
							tokens.push(token.substring(0, token.length - 1));
							token = '';
						}

						/* Add terms by manual geocoding */
						if (Geotyping.hash.hasItem(words[j])) {
							tokens.push(words[j]);
						}
					}
				}
			}
			return tokens;
		}
	});
}());