/*
Copyright (c) 2003-2010, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function(config) {
    config.toolbar = 'GeotypingToolbar';

    config.toolbar_GeotypingToolbar = [
    /* New page command resets all event listeners on the editor so we disable it ['NewPage'],*/
    /*['Source' ],*/
    ['Geotyping'],
    /*[ 'Cut', 'Copy', 'Paste', '-', ],*/
    [ 'Find', 'Replace', '-' ],
    [ 'Format' ],[ 'Bold', 'Italic', 'Strike' ], [ 'Link', 'Unlink'],[ 'Image' ] ];
	
    config.extraPlugins = 'geotyping-cke';
};
