function log(txt) {
	if (!debug) {
		return;
	}

	try {
		if (typeof console == 'object') {
			console.log(txt);
		} else {
			alert(txt);
		}
	} catch (ex) {
		alert(ex);
	}
}

function itenerator(obj) {
	for (item in obj) {
		log(item.toString() + ' value: ' + obj[item].toString());
	}
}
