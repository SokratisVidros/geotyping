/**
 * googlemaps.js
 * 
 * Googlemaps module, includes map geocoder bulk geocoding using queues and
 * reverse geocoding ...
 * 
 * Author: Sokratis Vidros
 * Date : 2-3-2011
 */

var GoogleMapsModule = {
    bounds: null,
    map: null,
    geocoder: null,
    selectedMarker: null,
    geocoderQueue: [],
    timeInterval: 1000,
    geocodedCounter: 0,
    queueSize: 0,

    /* Use paths relative to index.html */
    markerDefaultIcon: 'images/gm_default.png',
    markerEditableIcon: 'images/gm_editable.png',
    markerIconShadow: 'images/icon_shadow.png',

    /* Default center point is Greece */
    defaultLatlng: new google.maps.LatLng(39.074208, 21.824312),
    defaultZoom: 3,
    maxZoomLevel: 17,

    init: function (mapSelector) {
        var options = {
            zoom: this.defaultZoom,
            center: this.defaultLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER
            },
            navigationControl: true,
            navigationControlOptions: {
                style: google.maps.NavigationControlStyle.ZOOM_PAN,
                position: google.maps.ControlPosition.TOP_LEFT
            },
            scaleControl: false,
            scaleControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT
            }
        };
        this.map = new google.maps.Map($(mapSelector).get(0), options);
        this.bounds = new google.maps.LatLngBounds();
        this.geocoder = new google.maps.Geocoder();

        google.maps.event.addListener(this.map, 'zoom_changed', function () {
            zoomChangeBoundsListener = google.maps.event.addListener(
            GoogleMapsModule.map, 'bounds_changed', function (event) {
                if (this.getZoom() > GoogleMapsModule.getMaximumZoomLevel()) this.setZoom(GoogleMapsModule.getMaximumZoomLevel());
                google.maps.event.removeListener(zoomChangeBoundsListener);
            });
        });

        google.maps.event.addListener(this.map, 'mouseup', function (event) {
            if (GtManualTool.getContent()) {
                setTimeout(function () {
                    GtManualTool.hide();
                }, 10);
                var term = GtManualTool.getContent();
                GoogleMapsModule.renderMarker(event.latLng, term, term, false);
                Geotyping.setHighlight(term);
            }
        });
        GoogleMapsModule.renderClearControl();
    },
    renderClearControl: function () {
        var controlDiv = document.createElement('div');
        controlDiv.style.padding = '5px';
        controlDiv.index = 1;

        /* Set CSS for the control border */
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = 'white';
        controlUI.style.borderStyle = 'solid';
        controlUI.style.borderWidth = '1px';
        controlUI.style.borderColor = '#708DCE';
        controlUI.style.cursor = 'pointer';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Open marker list';
        controlDiv.appendChild(controlUI);

        /* Set CSS for the control interior */
        var controlText = document.createElement('DIV');
        controlText.style.fontFamily = 'Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.color = '#708DCE';
        controlText.style.fontWeight = 'bold';
        controlText.style.paddingLeft = '4px';
        controlText.style.paddingRight = '4px';
        controlText.innerHTML = 'Clear All';
        controlUI.appendChild(controlText);

        google.maps.event.addDomListener(controlDiv, 'click', function () {
            GoogleMapsModule.clearAll();
        });

        GoogleMapsModule.map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
    },
    pushToGeocodeQueue: function (sender, address) {
        var gObj = {
            'sender': sender,
                'address': address
        };
        GoogleMapsModule.geocoderQueue.push(gObj);
        GoogleMapsModule.queueSize = GoogleMapsModule.geocoderQueue.length;
    },
    bulkGeocode: function () {
        var interval = 0;
        GoogleMapsModule.geocodedCounter = 0;

        /*
         * Hide activity when geocoding wiil be finished. Time intervals are an
         * approximation
         */
        var totalGeocodingTime = GoogleMapsModule.geocoderQueue.length * 750;
        setTimeout('Geotyping.hideActivity();', totalGeocodingTime);

        while (GoogleMapsModule.geocoderQueue.length > 0) {
            var gObj = GoogleMapsModule.geocoderQueue.shift();
            /* Closure trick in while loop */
            var fnc = function (item) {
                return function () {
                    GoogleMapsModule.geocode(item.sender, item.address);
                };
            }(gObj);
            setTimeout(fnc, interval);
            interval += 500;
        }
        GoogleMapsModule.geocoder.length = 0;
    },
    geocode: function (sender, address) {
        if (this.geocoder) {
            log("Geocoding: " + address);
            this.geocoder.geocode({
                'address': address + Geotyping.getGtArea()
            },

            function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    GoogleMapsModule.geocodedCounter++;
                    Geotyping.showActivity('Geocoding: ' + GoogleMapsModule.geocodedCounter + ' of ' + GoogleMapsModule.queueSize + ' terms.');
                    GoogleMapsModule.renderMarker(
                    results[0].geometry.location,
                    results[0].formatted_address,
                    address, true);
                    /* Highlight new terms */
                    Geotyping.setHighlight(address, sender);
                } else {
                    log('ERROR:> Geocoding was not successful for the following reason: ' + status);
                }
            });
        }
    },
    reverseGeocode: function (sender, latlng) {
        if (this.geocoder) {
            this.geocoder.geocode({
                'latLng': latlng
            },

            function (results, status) {
                if (status != google.maps.GeocoderStatus.OK) {
                    /* Return marker to its previous position */
                    sender.setPosition(sender.previousPosition);
                    log("ERROR:>Reverse Geocode was not successful for the following reason: " + status);
                }
            });
        }
    },
    renderMarker: function (location, address, geoterm, autoZooming) {
        if (Geotyping.hash.hasItem(geoterm)) {
            var renderedMarker = Geotyping.hash.getItem(geoterm);
            /* Increment marker occurrences */
            renderedMarker.occurrences++;
            /*
             * If marker is invisible make it visible. Only one marker is
             * visible for each geoterm.
             */
            if (!renderedMarker.getMap()) renderedMarker.setMap(GoogleMapsModule.map);
            Geotyping.hash.setItem(geoterm, renderedMarker);
            Geotyping.setHighlight(geoterm);
            log('RenderMarker:>Marker is already in the hash! Occurence updated!');
            return;
        }

        /* Add custom default image marker */
        var customDefaultIcon = new google.maps.MarkerImage(
        this.markerDefaultIcon, new google.maps.Size(20.0, 34.0),
        new google.maps.Point(0, 0), new google.maps.Point(10.0, 34.0));

        /* Add custom shadow to markers */
        var customIconShadow = new google.maps.MarkerImage(
        this.markerIconShadow, new google.maps.Size(38.0, 34.0),
        new google.maps.Point(0, 0), new google.maps.Point(10.0, 34.0));

        /* Create new marker */
        var marker = new google.maps.Marker({
            map: GoogleMapsModule.map,
            position: location,
            draggable: false,
            title: address,
            icon: customDefaultIcon,
            shadow: customIconShadow
        });

        /* Create and Render infoWindow */
        var infoWindow = GoogleMapsModule.renderInfoWindow(marker, address);

        /* Extending Google Marker */
        marker.infoWindow = infoWindow;
        marker.previousPosition = null;
        marker.occurrences = 1;
        marker.geoterm = geoterm;

        /* Center the map according to the clicked marker */
        google.maps.event.addListener(marker, 'click', function (event) {
            GoogleMapsModule.panToMarker(marker);
        });

        /* On dragstart keep markers previous position. */
        google.maps.event.addListener(marker, 'dragstart', function (event) {
            marker.previousPosition = event.latLng;
        });

        /*
         * On dragend update marker's infoWindow and set draggable state to
         * false
         */
        google.maps.event.addListener(marker, "dragend", function (event) {
            // var newAddress = GoogleMapsModule.reverseGeocode(marker,
            // marker.getPosition());
            marker.setDraggable(false);
            marker.setIcon(customDefaultIcon);
        });

        /* Append to hash */
        Geotyping.hash.setItem(geoterm, marker);

        /* Extend map bounds for perfect zoom */
        this.bounds.extend(location);
        if (autoZooming) this.map.fitBounds(this.bounds);
    },
    renderAllMarkers: function () {
        if (Geotyping.hash) {
            for (var key in Geotyping.hash.items) {
                Geotyping.hash.items[key].setMap(GoogleMapsModule.map);
            }
        }
    },
    clearAll: function () {
        if (confirm('Geotyping: Delete all data from text & markers ?')) {
            if (Geotyping.hash) {
                for (var key in Geotyping.hash.items) {
                    GoogleMapsModule.deleteMarker(Geotyping.hash.items[key],
                    true);
                }

                Geotyping.hash.clear();
                this.resetMap();
                Geotyping.reset();
            }
        }
    },
    resetMap: function () {
        this.map.setCenter(this.defaultLatlng);
        this.map.setZoom(this.defaultZoom);
        this.bounds = new google.maps.LatLngBounds();
    },
    editMarker: function (marker) {
        /* Change icon */
        var customEditIcon = new google.maps.MarkerImage(
        this.markerEditableIcon, new google.maps.Size(20.0, 34.0),
        new google.maps.Point(0, 0), new google.maps.Point(10.0, 34.0));

        marker.setIcon(customEditIcon);
        marker.setDraggable(true);
    },
    deleteMarker: function (marker, removeHighlight) {
        if (marker) {
            marker.infoWindow.close();
            marker.setMap(null);

            if (removeHighlight) Geotyping.removeHighlight(marker.geoterm);

            Geotyping.hash.removeItem(marker.geoterm);

            this.updateBounds(true);
            if (Geotyping.hash.length == 0) {
                GoogleMapsModule.resetMap();
            }
        }
    },
    updateBounds: function (autoZoom) {
        if (autoZoom) {
            this.bounds = new google.maps.LatLngBounds();

            for (var key in Geotyping.hash.items) {
                this.bounds.extend(Geotyping.hash.items[key].position);
            }

            this.map.fitBounds(this.bounds);
        }
    },
    renderInfoWindow: function (marker, text) {
        var wrapperDiv = document.createElement('div');
        $('<p/>').html(text).appendTo(wrapperDiv);

        var buttonDiv = document.createElement('div');

        $(buttonDiv).css({
            'text-align': 'center'
        });

        $('<a/>').html('Edit marker').attr({
            'href': 'javascript:void(0)',
                'class': 'meb'
        }).click(function () {
            GoogleMapsModule.editMarker(marker);
        }).appendTo(buttonDiv);
        $('<a/>').html('Delete marker').attr({
            'href': 'javascript:void(0)',
                'class': 'bdb'
        }).click(function () {
            GoogleMapsModule.deleteMarker(marker, true);
        }).appendTo(buttonDiv);
        $(buttonDiv).appendTo(wrapperDiv);
        $(wrapperDiv).css({
            'height': 'auto',
                'overflow': 'auto'
        });
        var infoWin = new google.maps.InfoWindow({
            content: wrapperDiv,
            maxWidth: 300
        });

        return infoWin;
    },
    editInfoWindow: function (infoWindow, text) {
        var content = infoWindow.getContent();
        $(content).find('p').replaceWith($('<p/>').html(text));
    },
    panToMarker: function (marker) {
        if (GoogleMapsModule.selectedMarker) GoogleMapsModule.selectedMarker.infoWindow.close();

        GoogleMapsModule.selectedMarker = marker;
        GoogleMapsModule.map.panTo(marker.getPosition());
        marker.infoWindow.open(this.map, marker);
    },
    getMaximumZoomLevel: function () {
        return parseInt(GoogleMapsModule.maxZoomLevel);
    },
    setMaximumZoomLevel: function (value) {
        if ((value) || (value.toString().length > 0)) {
            if (value > 20) value = 20;
            if (value < 0) value = 0;
            GoogleMapsModule.maxZoomLevel = value;
        }
    }
};