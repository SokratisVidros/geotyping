/**
 * geotyping.js
 * 
 * Live geocoding of free text
 *
 * Author:		Sokratis Vidros
 * Date :       21-10-2010
 */

var Geotyping = Geotyping || {};

(Geotyping = function () {
    var editor;
    var FOLDER = '/geotyping';
    var WEBSITE_URL = location.origin + FOLDER;

    /* Current and previous selected CK Dom Elements */
    var pElement;
    var cElement;

    var mousePosition = null;

    var req = {
        postReq: {
            type: 'POST',
            url: WEBSITE_URL + '/proxy_post.jsp'
        },
        getReq: {
            type: 'GET',
            url: WEBSITE_URL + '/proxy_get.jsp'
        }
    };

    /* Default configuration */
    var defaultConf = {
        debug: true,
        useExternalParser: false,
        request: req.getReq,
        limitGtArea: '',
        containers: {
            editor: {
                container: '#editor',
                textarea: '#editor1'
            },
            manualTool: 'gtmTool',
            activity: '#activity',
            map: {
                container: '#googlemaps',
                canvas: '#map-canvas',
                list: '#markers-list',
                listButtons: '#list-buttons'
            }
        },
        style: {
            ratio: 3 / 5
        }
    };

    /* Hash table structure that stores highlighted terms with their markers */
    var gtHash = new Hash(true, defaultConf.containers.map.list);

    /* Blacklist */
    var gtBlacklist = [];

    /* Class states for block html elements in CKEditor's textarea */
    var GEOTYPING_ELEMENT_ATTRIBUTE_STATE = {
        /*
         * Element waits to be send to the geoparser
         * (Initial state)
         */
        dirty: 'gt-dirty',
        /*
         * Element's text has been geoparsed and
         * geoterms need to be send for geocoding
         */
        geoparsed: 'gt-geoparsed',
        /*
         * Element's extracted geoterms have been
         * geocoded (Final state)
         */
        geocoded: 'gt-geocoded',
        /*
         * Element has been previously processed but
         * now it is modified
         */
        modified: 'gt-modified',
        /* Selected element */
        selected: 'gt-selected'
    };

    /*
     * ================================================================================================
     * CKEditor utility functions
     * ================================================================================================
     */

    /* Returns plainText from CKEDITOR - not used */
    function plainTextParser() {
        var parser = new CKEDITOR.htmlParser();
        var parsedText = '';
        /* Enhance parser */
        parser.regex = /\n|\t|&nbsp;|&quot;|&amp;/g;
        parser.onText = function (text) {
            if ((text != undefined) || (text != null)) {
                parsedText += (text.replace(this.regex, '') + " ");
            }
        };
        return parsedText;
    }

    /* Get all text nodes in editing area using JQuery */
    function getAllTextNodes(elem) {
        $(elem).contents().filter(function () {
            return this.nodeType == Node.TEXT_NODE;
        });
    }

    /* Execute an editor command */
    function executeCommand(commandName) {
        editor.execCommand(commandName);
    }

    /*
     * Check if editor is dirty comparing its state to the time resetDirty() was
     * invoked
     */
    function isDirty() {
        return editor.checkDirty();
    }

    /* Reset editor's dirty state */
    function resetDirty() {
        editor.resetDirty();
    }

    /*
     * ================================================================================================
     * Core functions
     * ================================================================================================
     */

    /*
     * 
     * Geocodes each extracted geoterm if its not already geocoded and highlights its text in the editor.
     * 
     * @params:
     *		(DOM) element,
     *		(Array) geoTermsList
     */
    function processGeoterms(element, geotermsList) {
        for (var i = 0; i < geotermsList.length; i++) {
            var currentTerm = geotermsList[i].toString();
            /* Check if term already exists in hash and highlight it */
            if (gtHash.hasItem(currentTerm)) {
                /* Get marker from hash */
                var marker = gtHash.getItem(currentTerm);
                /* Increment marker occurrences */
                marker.occurrences++;
                /*
                 * If marker is invisible add it to the map. Only one marker can
                 * be visible for each geoterm
                 */
                if (!marker.getMap()) {
                	marker.setMap(GoogleMapsModule.map);
                }
                gtHash.setItem(currentTerm, marker);

                /* Highlight term */
                Geotyping.setHighlight(currentTerm, element.$);
                log('ProcessGeoterms:> Geoterm ' + currentTerm + ' was already geocoded!');
            } else {
                /* Send term for Geocoding */
                GoogleMapsModule.pushToGeocodeQueue(element.$, currentTerm);
                log('ProcessGeoterms:> Geoterm ' + currentTerm + ' was added to Geocoder queue!');
            }
        }
        /* Fire Geocoding */
        GoogleMapsModule.bulkGeocode();

        /* Mark element as geocoded */
        element.setAttribute('class', GEOTYPING_ELEMENT_ATTRIBUTE_STATE.geocoded);
    }

    /*
     * 
     * Send text for geoparsing.
     * 
     * @params:
     * 		(DOM)element,
     * 		(Text) text
     * 
     * @returns:
     * 		An array with all candidate geoterms found in the provided element.
     */
    function geoparse(element, text) {
        var geoTerms = [];
        if ((text) && (!isEmpty(text)) && (element.getHtml() != '<br>')) {
            /* Mark element as dirty */
            element.setAttribute('class',
            GEOTYPING_ELEMENT_ATTRIBUTE_STATE.dirty);

            /* Use external "smart" geoparser */
            if (defaultConf.useExternalParser) {
                $.ajax({
                    url: defaultConf.request.url,
                    async: true,
                    type: defaultConf.request.type,
                    /* dataType : 'xml', */
                    data: {
                        sentence: text
                    },
                    timeout: 50000,
                    beforeSend: function () {
                        log('Geoparse:> New Geoparse request for : ' + text);
                        Geotyping.showActivity('Geoparsing...');
                    },
                    complete: function () {},
                    error: function (responseObject, status, error) {
                        Geotyping.hideActivity();
                        log('Geoparse:> Geoparsing Error on loading XML document! Info: ' + status + " " + error);
                    },
                    success: function (data, status, request) {
                        Geotyping.hideActivity();
                        
                        log('Geoparse:> Response XML: ' + data);
                        
                        /* Mark element as geoparsed */
                        element.setAttribute('class', GEOTYPING_ELEMENT_ATTRIBUTE_STATE.geoparsed);
                        
                        $(data).find('poi').each(
                        function () {
                            var poiName = $(this).attr('name');
                            var poiStartOffSet = $(this).attr(
                                'startOffset');
                            var poiEndOffSet = $(this).attr(
                                'endOffset');
                            geoTerms.push(poiName);
                        });
                        
                        /* Send all geoterms for geocoding */
                        processGeoterms(element, geoTerms);
                    }
                });
            } else {
            	/* Use an internal "dummy" parser - used for only for testing */
                log('Geoparse:> New Geoparse request for: ' + text);

                /* Extraxt geoterms using interal parser */
                geoTerms = Parser.parse(text);

                /* Mark element as geoparsed */
                element.setAttribute('class',
                GEOTYPING_ELEMENT_ATTRIBUTE_STATE['geoparsed']);

                /* Send all geoterms for geocoding */
                processGeoterms(element, geoTerms);
            }
        }
    }

    /*
     * Gets the previous and current block element from CKEditor 
     * when the selection changed event is triggered

     * @params:
     * 		selection_changed event
     */
    function processSelection(event) {
        log('ProcessSelection:> Selection Changed in editor!');

        /* Get selection from event data */
        var selection = event.data.selection;

        /* Get selection's start element */
        var element = selection.getStartElement();

        if (element.type == CKEDITOR.NODE_ELEMENT) {
            if (element.is('body')) {
                cElement = undefined;
                log('ProcessSelection:> Body selected! Previous element cleared!');
                return;
            }

            /* Escape event from inline style elements */
            if (element.is('strong', 'strike', 'em')) {
                return;
            }

            /* Focus on highlighted elements */
            if ((element.is('span')) && (element.hasClass('highlight')) && (!element.hasClass('invisible'))) {
            	var marker = gtHash.getItem(element.getText());
                GoogleMapsModule.panToMarker(marker);
            }

            if (element.is('img')) {
                var next = element.getNext();
                if (next.is('span') && next.hasClass('highlight') && next.hasClass('ghost')) {
                    var marker = gtHash.getItem(next.getText());
                    GoogleMapsModule.panToMarker(marker);
                }
            }

            var parentBlock = getParentBlock(element);

            if ((cElement) && (pElement)) {
                if (parentBlock.equals(cElement)) {
                    log('ProcessSelection:> Equal elements');
                    return;
                }
            }

            pElement = cElement;
            cElement = parentBlock;

            if (cElement.hasClass(GEOTYPING_ELEMENT_ATTRIBUTE_STATE.geocoded)) {
                updateTerms(cElement);
            }

            if (pElement.is('p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'pre', 'address')) {

                var text = pElement.getText();

                text += processImages(pElement);
                text = jQuery.trim(text);

                /* Blacklist */
                for (term in gtBlacklist) {
                    log('Blacklist: ' + term);
                    if (text.indexOf(term)) text = text.replace(term, '');
                }

                /* Process previous element */
                if (pElement.hasClass(GEOTYPING_ELEMENT_ATTRIBUTE_STATE.modified)) {
                    var termsBuffer = pElement.terms;

                    $(pElement.$).removeHighlight();

                    /* Restore its geoterms that still in place */
                    var limitedText = text;
                    for (term in termsBuffer) {
                        if ((text.indexOf(termsBuffer[term]) >= 0) && (Geotyping.hash.hasItem(term))) {
                            limitedText = limitedText.replace(
                            termsBuffer[term], '');
                            Geotyping.setHighlight(termsBuffer[term],
                            pElement.$);
                            log('ProcessSelection:> Prev elem - Geoterm restored : ' + termsBuffer[term]);
                        } else {
                            Geotyping.removeMarkerInstance(termsBuffer[term]);
                        }
                    }

                    /* Geoparse the rest of the text */
                    geoparse(pElement, limitedText);
                } else if (pElement.hasClass(GEOTYPING_ELEMENT_ATTRIBUTE_STATE.selected)) {
                    pElement.setAttribute('class',
                    GEOTYPING_ELEMENT_ATTRIBUTE_STATE.geocoded);
                } else {
                    geoparse(pElement, text);
                }

                if (cElement.hasClass(GEOTYPING_ELEMENT_ATTRIBUTE_STATE['geocoded'])) {
                    // TODO Process current element
                }
            } else {
                log('ProcessSelection:> Previous element is not a valid block element!' + pElement.getName());
            }
        } else {
            log('ProcessSelection:> Previous element is not a valid CKeditor node element ');
        }

        log('ProcessSelection:> Previous elem: ' + pElement.getName() + ' text: ' + pElement.getText() + ' noTerms: ' + pElement.terms.length + ' class: ' + pElement.getAttribute('class'));
        log('ProcessSelection:> Current elem: ' + cElement.getName() + ' text: ' + cElement.getText() + ' noTerms: ' + cElement.terms.length + ' class: ' + cElement.getAttribute('class'));

        resetDirty();
    }

    /*
     * Process current selected element that was previously parsed and geocoded
     * and now its being edited. The strategy is to remove all the geoterms from 
     * the current element, buffer them and restore only the ones that remain in place.
     * 
     * params:
     * 		(DOM)element
     */
    function modify(element) {
        if ((element) && (element.hasClass(GEOTYPING_ELEMENT_ATTRIBUTE_STATE.selected))) {
            /* Make highlight invisible */
            Geotyping.unsetHighlight(element.$);
            element.setAttribute('class',
            GEOTYPING_ELEMENT_ATTRIBUTE_STATE.modified);

            log('Modify:> Edit current element: ' + element.getName() + ' text: ' + element.getText());
        }
    }

    function updateTerms(element) {
        extractTerms(element);
        element.setAttribute('class',
        GEOTYPING_ELEMENT_ATTRIBUTE_STATE.selected);
        log('Update:> Current Element: ' + element.getName() + ' text: ' + element.getText());
    }

    function extractTerms(element) {
        var termsBuffer = new Array();
        $(element.$).find('span.highlight').each(function () {
            termsBuffer.push($(this).text());
        });
        element.terms = termsBuffer;
    }

    function processRange(range) {
        var startNode = range.startContainer;
        var endNode = range.endContainer;

        var domStartNode = startNode.$;
        var domEndNode = endNode.$;

        /* FF fix for Ctrl + A Selection */
        if ((domStartNode.nodeType == 1) && (domStartNode.nodeName.toLowerCase() == 'body')) {
            domStartNode = domStartNode.firstChild;
        }
        
        //if ((domEndNode.nodeType == 1) && (domEndNode.nodeName.toLowerCase() == 'body')) {
        //	domEndNode = domEndNode.firstChild;
        //}

        if ((domStartNode.nodeType == 3) && (domStartNode.parentNode.nodeName.toLowerCase() == 'span')) {
            domStartNode = domStartNode.parentNode;
        }
        
        if ((domEndNode.nodeType == 3) && (domEndNode.parentNode.nodeName.toLowerCase() == 'span')) {
            domEndNode = domEndNode.parentNode;
        }
        
        /* Traverse from startNode untill endNode */
        do {
            log('ProcessRange:> ' + domStartNode.nodeName + ' : ' + (domStartNode.nodeValue || domStartNode.innerHTML));
            if ($(domStartNode).hasClass('highlight')) {
                cElement.terms.length = 0;
                Geotyping.removeMarkerInstance(domStartNode.innerHTML);
            }
        } while (domStartNode = gtDomWalker(domStartNode, false, domEndNode));

        /* FF fix - Search endNode for span contents */
        if (CKEDITOR.env.gecko) {
            $(endNode.$).find('.highlight').each(function () {
                Geotyping.removeMarkerInstance($(this).text());
            });
        }
    }

    function checkRangeForHighlights(range) {
        var startNode = range.startContainer;
        var endNode = range.endContainer;

        var domStartNode = startNode.$;
        var domEndNode = endNode.$;

        if ((startNode.equals(endNode) && domStartNode.childNodes.length == 0) && (domStartNode.className == 'highlight')) {
            return false;
        }

        do {
            if ((domStartNode.className == 'highlight') || validBlockDomElem[domStartNode.nodeName.toLowerCase()] || domStartNode.nodeName.toLowerCase() == 'img') {
            	return false;
            }
        } while (domStartNode = gtDomWalker(domStartNode, false, domEndNode));
        return true;
    }

    function gtDomWalker(node, skipChildren, endNode) {
        if (endNode == node) {
            return null;
        }
        if (node.firstChild && !skipChildren) {
            return node.firstChild;
        }
        if (!node.parentNode) {
            return null;
        }
        return node.nextSibling || gtDomWalker(node.parentNode, true, endNode);
    }

    function processImages(element) {
        var altText = ' ';
        $(element.$).find('img').each(function () {
            var alt = $(this).attr('alt');
            if (alt.length > 0) {
                altText += (alt + ' ');
                log('ProcessImage:> Alt from images:' + alt);
            }
        });
        return (altText);
    }

    /*
     * ================================================================================================
     * Editor's event listeners
     * ================================================================================================
     */

    var selectionChangedListener = function (e) {
        processSelection(e);
    };

    var keyUpListener = function (e) {
        if (GtManualTool.isVisible()) GtManualTool.hide();

        if (isDirty()) {
            modify(cElement);
        }
    };

    var keyPressedListener = function (e) {
        var range = Geotyping.getRealRange();
        if (range) processRange(range);
    };

    var instanceReadyListener = function (e) {
    	/* Bind DnD manual geocoding */
        e.editor.document.on('mousedown', function (e) {
            setTimeout(function () {
                if (GtManualTool.isVisible()) GtManualTool.hide();
                return;
            }, 10);
        });
        e.editor.document.on('mouseup', function (e) {});
        e.editor.document.on('mousemove', function (e) {
            mousePosition = getMousePosition(e);
            if (GtManualTool.isVisible()) GtManualTool.moveInsideEditor(getMousePosition(e));
        });
        e.editor.document.on('keyup', keyUpListener);
    };

    /*
     * ================================================================================================
     * Utility functions
     * ================================================================================================
     */

    var validBlockDomElem = {
        p: 1,
        div: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        address: 1,
        pre: 1
    };

    function getParentBlock(element) {
        if (!validBlockDomElem[element.getName()]) return getParentBlock(element.getParent());
        else return element;
    }

    function isDomEqual(element1, element2) {
        return element1.getHtml() === element2.getHtml();
    }

    function isEmpty(str) {
        return (!str || 0 === str.length);
    }

    function trim(str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }

    function setSizes() {
        var h = $(window).height() * defaultConf.style.ratio;
        
        $(defaultConf.containers.map.canvas).height(h);
        $(defaultConf.containers.map.list).height(h - 20);
        $(defaultConf.containers.map.listButtons).css('top', '80%');
        
        if (editor) {
        	editor.resize("100%", h);
        }

        $(defaultConf.containers.map.container).height(h);
    }

    function getMousePosition(e) {
        e = e.data.$;

        var offset = $(defaultConf.containers.editor.container).offset();
        var posX = offset.left + 10;
        var posY = offset.top + 40;

        if (e.pageX || e.pageY) {
            posX += e.pageX;
            posY += e.pageY;
        } else if (e.clientX || e.clientY) {
            posX += e.clientX;
            posY += e.clientY;
        }
        return {
            x: posX,
            y: posY
        };
    }

    /*
     * ===================================================================================================
     * Geotyping public functions
     * ==================================================================================================
     */

    return ({
        hash: gtHash,
        reset: function () {
            pElement = undefined;
            cElement = undefined;
            resetDirty();
            /*
             * @TODO: There is a bug when removing all document event listeners.
             * as the Set Data event is fired! (editor.setData();)
             * Cuurent fix is to reload the full page
             */
            location.reload(true);
        },
        getRealRange: function () {
            var range = editor.getSelection().getRanges()[0];
            var isOffsetEqual = (range.endOffset == range.startOffset);
            var isNodeEqual = range.startContainer.equals(range.endContainer);
            return (isOffsetEqual && isNodeEqual) ? null : range;
        },
        getSelectionText: function (isValid) {
            var selection = editor.getSelection();

            /* Check for valid selection - without highlighted terms */
            if (isValid) {
                /* Check if highlighted span is the first node in the selected */
                if (selection.getStartElement().hasClass('highlight')) return null;

                /* Checking forward if highlighted span is in the range */
                var range = selection.getRanges()[0];
                if (!checkRangeForHighlights(range)) return null;
            }

            if (CKEDITOR.env.ie) {
                selection.unlock(true);
                selectedText = selection.getNative().createRange().text;
            } else {
                selectedText = selection.getNative();
            }
            
            return selectedText.toString();
        },
        clearSelection: function () {
            var selection = editor.getSelection();
            if (CKEDITOR.env.ie) {
                selection.unlock(true);
                //var range = selection.getNative().createRange();
                document.selection.empty();
            } else {
                selection.getNative().removeAllRanges();
            }
        },
        blur: function () {
            editor.focusManager.blur();
        },
        focus: function () {
            editor.focus();
        },
        setHighlight: function (term, element) {
            if (element) {
                /* Highlight specified element */
                $(element).highlight(term);
            } else {
                /* or highlight the editor's body */
                var nativeBody = editor.document.getBody().$;
                $(nativeBody).highlight(term);
            }
        },
        unsetHighlight: function (element) {
            /* Disable selection changed listener */
            editor.removeListener('selectionChange', selectionChangedListener);

            if (element) {
                /*
                 * Keep geoterms
                 * $(element).find('span.highlight').each(function() {
                 * geotermsBuffer.push($(this).text()); });
                 */

                $(element).destroyHighlight();
            }
            /* Enable selection changed listener */
            editor.on('selectionChange', selectionChangedListener);
        },
        removeHighlight: function (term) {
            /* Disable selection changed listener */
            editor.removeListener('selectionChange', selectionChangedListener);

            var nativeBody = editor.document.getBody().$;
            
            if (term) {
            	$(nativeBody).removeHighlight(term);
            }
            
            else $(nativeBody).removeHighlight();

            /* Enable selection changed listener */
            editor.on('selectionChange', selectionChangedListener);
        },
        addToBlacklist: function (term) {
            if (gtBlacklist[term] == undefined) {
            	gtBlacklist[term] = 1;
            }
        },
        getGtArea: function () {
            return defaultConf.limitGtArea;
        },
        setGtArea: function (value) {
            if (value) {
            	defaultConf.limitGtArea = value;
            }
        },
        getMousePositionSnapshot: function () {
            return mousePosition;
        },
        removeMarkerInstance: function (term) {
            if (gtHash.hasItem(term)) {
                var marker = gtHash.getItem(term);
                log('RemoveMarkerInstance:> Removing Term: ' + term + ' occurrencess: ' + marker.occurrences);
                
                /* If marker is binded only to this term delete it */
                if (marker.occurrences == 1) {
                    /* Delete marker */
                    GoogleMapsModule.deleteMarker(marker, false);
                } else {
                    /* Decrement marker's occurrence */
                    marker.occurrences--;
                    gtHash.setItem(term, marker);
                }
            }
        },
        init: function (conf) {
            /* Get current configuration */
            jQuery.extend(defaultConf, conf);

            window.debug = conf.debug;
            
            setSizes();
            $(window).resize(function () {
                setSizes();
                google.maps.event.trigger(GoogleMapsModule.map, "resize");
            });

            /* Jquery adapter for CKeditor */
            var editorOptions = {
                startupFocus: true,
                toolbar: 'GeotypingToolbar',
                tabindex: 1,
                contentsCss: 'scripts/geotyping/highlight.css',
                forcePasteAsPlainText: true,
                fillEmptyBlocks: false,
                width: '100%',
                // @TODO For IE width must be in pixels not in percentage
                // width: '100%' || '500px',
                height: $(window).height() * defaultConf.style.ratio - 75,
                resize_enabled: true,
                on: {
                    'instanceReady': instanceReadyListener,
                    'key': keyPressedListener,
                    'selectionChange': selectionChangedListener,
                    'setData': instanceReadyListener
                }
            };

            /* Initialize CKEditor */
            $(defaultConf.containers.editor.textarea).ckeditor(editorOptions);

            /* Get CKEDITOR.editor object */
            editor = $(defaultConf.containers.editor.textarea).ckeditorGet();

            /* log(editor._.events); */
            /* Extend CK Dom element */
            CKEDITOR.dom.element.prototype.terms = new Array();
            CKEDITOR.dom.element.prototype.blacklist = new Array();

            GoogleMapsModule.init(defaultConf.containers.map.canvas);

            GtManualTool.init(defaultConf.containers.manualTool);

        },
        getGeotermsJson: function () {
            var markers = new Array();
            for (term in gtHash.items) {
                var marker = gtHash.getItem(term);
                markers.push({
                    lat: marker.position.lat(),
                    lng: marker.position.lng(),
                    address: marker.title,
                    geoterm: marker.geoterm
                });
            }

            var markersJson = {};
            markersJson.markers = markers;
            
            var markersSerialized = JSON.stringify(markersJson);
            return markersSerialized;
        },
        getGeotermsXml: function () {
            /* Create Xml Container */
            var xml = new XMLWriter('UTF-8');
            xml.writeStartDocument();
            xml.writeStartElement('markers');
            for (term in gtHash.items) {
                var marker = gtHash.getItem(term);
                xml.writeStartElement('marker');
                xml.writeAttributeString('geoterm', marker.geoterm);
                xml.writeAttributeString('address', marker.title);
                xml.writeAttributeString('lat', marker.position.lat());
                xml.writeAttributeString('lng', marker.position.lng());
                xml.writeEndElement();
            }
            xml.writeEndElement();
            xml.writeEndDocument();
            return xml.flush();
        },
        getHtmlText: function () {
            return editor.getData();
        },
        showActivity: function (text) {
            if (!$(defaultConf.containers.activity + ' span').is(":visible")) {
            	$(defaultConf.containers.activity + ' span').show('fast');
            }
            $(defaultConf.containers.activity + ' span').html(text);
        },
        hideActivity: function () {
            if ($(defaultConf.containers.activity + ' span').is(":visible")) {
            	$(defaultConf.containers.activity + ' span').hide('fast');
            }
        },
        setConfig: function (name, value) {
            defaultConf[name] = value;
        },
        getConfig: function (name) {
            return defaultConf[name];
        },
        setRequestType: function (type) {
            if (type == 'POST') {
                defaultConf.request = req.postReq;
            } else if (type == 'GET') {
                defaultConf.request = req.getReq;
            }
        },
        loadXml: function (id) {
            $.ajax({
                type: "GET",
                async: true,
                data: {
                    article_id: id
                },
                url: "/gtms/geoterms",
                error: function (responseObject, status, error) {
                    alert(error);
                },
                beforeSend: function () {
                    log('Loading geoterms...');
                    Geotyping.showActivity('Loading...');
                },
                complete: function () {},
                success: function (xml) {
                    $(xml).find('marker').each(function () {
                        var geoterm = $(this).attr('geoterm');
                        var address = $(this).attr('address');
                        var lat = $(this).attr('lat');
                        var lon = $(this).attr('lng');
                        var position = new google.maps.LatLng(lat, lon);
                        GoogleMapsModule.renderMarker(position, address, geoterm);
                    });
                    Geotyping.hideActivity();
                }
            });
        }
    });
}());
