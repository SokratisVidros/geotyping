/**
 * hash.js
 * 
 * A custom hash table implementation tailored for Geotyping.
 * 
 * Author: Sokratis Vidros Date: 10/6/2011
 */

(function () {
	function Hash(isVisual, visualElement) {
		this.length = 0;
		this.items = [];
	
		/* Set the <ul/> element that will display the hash */
		this.isVisual = isVisual;
		this.vElement = visualElement;
	}
	
	Hash.prototype = {
		printAll : function () {
			for (var key in this.items) {
				console.log('Printing hash...');
				console.log('Hash:> ' + key + ' => ' + this.items[key]);
			}
		},
		processHashKey : function (hashKey) {
			/* All keys must be lowercase and sanitized */
			hashKey = hashKey.toLowerCase();
			hashKey = hashKey.replace(/ /g, '_');
			return hashKey;
		},
		getItem : function (hashKey) {
			hashKey = this.processHashKey(hashKey);
			return this.items[hashKey];
		},
		setItem : function (hashKey, value) {
			/* Insert or edit an existing item in the hash */
			hashKey = this.processHashKey(hashKey);
			var tmp_previous = {};
			if (typeof (value) != 'undefined') {
				if (typeof (this.items[hashKey]) == 'undefined') {
					this.length++;
					
					/* Display insertion */
					if (this.isVisual) {
						$('<li />').attr({
							'class' : hashKey
						}).html(value.title).click(function () {
							GoogleMapsModule.panToMarker(value);
						}).appendTo(this.vElement);
					}
				} else {
					tmp_previous = this.items[hashKey];
					if (this.isVisual) {
						$(this.vElement).find('li.' + hashKey).html(value.title);
					}
				}
				this.items[hashKey] = value;
			}
			return tmp_previous;
		},
		hasItem : function (hashKey) {
			hashKey = this.processHashKey(hashKey);
			return typeof (this.items[hashKey]) != 'undefined';
		},
		removeItem : function (hashKey) {
			hashKey = this.processHashKey(hashKey);
			var tmp_previous = {};
			if (typeof (this.items[hashKey]) != 'undefined') {
				this.length--;
				tmp_previous = this.items[hashKey];
				delete this.items[hashKey];
	
				/* Display deletion */
				if (this.isVisual)
					$(this.vElement).find('li.' + hashKey.replace(' ', '-'))
							.remove();
			}
			return tmp_previous;
		},
		clear : function () {
			for (var i in this.items) {
				delete this.items[i];
			}
			this.length = 0;
	
			if (this.isVisual) {
				$(this.vElement).empty();
			}
		}
	};

	window.Hash = Hash;
})(window);
