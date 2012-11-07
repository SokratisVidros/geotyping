$(document).ready(function() {
	
	/* Initialize Geotyping */
	Geotyping.init({debug: false});

	/* Api buttons */
	$("#getXmlDataButton").click(function () {
		var data = Geotyping.getGeotermsXml();
		if (data.length == 0)
			alert("No markers found!");
		else
			alert(data);
	});
	
	$("#getJsonDataButton").click(function () {
		var data = Geotyping.getGeotermsJson();
		if (data.length == 0)
			alert("No markers found!");
		else
			alert(data);
	});

	/* Side list buttons */
	$("#openList").click(function () {
		$("#list-buttons img").toggle();
		$("#list-buttons").animate( {
			right : '180px'
		}, 500, function () {
		});
		$("#map-list").animate( {
			right : '0px'
		}, 500, function() {
		});
	});

	$("#closeList").click(function () {
		$("#list-buttons").animate( {
			right : '-10px'
		}, 500, function () {
		});
		$("#map-list").animate( {
			right : '-191px'
		}, 500, function () {
		});
		$("#list-buttons img").toggle();
	});
});