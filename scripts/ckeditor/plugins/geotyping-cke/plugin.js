CKEDITOR.plugins.add('geotyping-cke', {
    init : function(editor) {
        var pluginName = 'geotyping-cke';
        CKEDITOR.dialog.add(pluginName,
            this.path + 'dialogs/geotyping-cke.js');
        var command = editor.addCommand(pluginName, new CKEDITOR.dialogCommand(
            pluginName));
        command.modes = {
            wysiwyg : 1,
            source : 0
        };
        command.canUndo = false;
        editor.ui.addButton('Geotyping', {
            label : 'Geotyping settings',
            command : pluginName
        });
        /* Add commands */
        editor.addCommand('resetCommand', {
            exec : function(editor) {
                GoogleMapsModule.clearAll();
            }
        });

        editor.addCommand('removeCommand', {
            exec : function(editor) {
                var selection = editor.getSelection();
                var element = selection.getStartElement();
                if ((element.is('span')) && (element.hasClass('highlight'))
                    && (!element.hasClass('invisible'))) {
                    var marker = Geotyping.hash.getItem(element.getText());
                    GoogleMapsModule.deleteMarker(marker,true);
                } else
                    return;
            }
        });
        editor.addCommand('manualLocateCommand', {
            exec : function(editor) {
                var selection = Geotyping.getSelectionText(true);
                if (!selection || selection.length == 0)
                    return;
                setTimeout(function() {
                    var position = Geotyping.getMousePositionSnapshot();
                    GtManualTool.show(position, selection);
                }, 10);
            }
        });
        editor.addCommand('addToBlacklist', {
            exec : function(editor) {      
                var selection = editor.getSelection();
                var element = selection.getStartElement();
                if ((element.is('span')) && (element.hasClass('highlight'))
                    && (!element.hasClass('invisible'))) {
                    var term = element.getText();
                    if(confirm("Are you sure you want to stop geocoding the word '" + term + "' ?"))
                    {
                        var marker = Geotyping.hash.getItem(term);
                        GoogleMapsModule.deleteMarker(marker,true);
                        Geotyping.addToBlacklist(term);
                    }
                } else
                    return;
            }
        });

        /* Add context menu items */
        if (editor.addMenuItem) {
            /* Add a menu group */
            editor.addMenuGroup('geotyping-group');

            /* Create a menu item */
            editor.addMenuItem('gtMenuItem1', {
                label : 'Locate on map',
                command : 'manualLocateCommand',
                group : 'geotyping-group',
                icon : CKEDITOR.getUrl(this.path + 'images/pin1.png')
            });

            /* Create a menu item */
            editor.addMenuItem('gtMenuItem2', {
                label : 'Remove marker',
                command : 'removeCommand',
                group : 'geotyping-group',
                icon : CKEDITOR.getUrl(this.path + 'images/rem1.png')
            });

            /* Create a menu item */
            editor.addMenuItem('gtMenuItem3', {
                label : 'Add to blacklist',
                command : 'addToBlacklist',
                group : 'geotyping-group',
                icon : CKEDITOR.getUrl(this.path + 'images/bl1.png')
            });

            /* Create a menu item */
            editor.addMenuItem('gtMenuItem4', {
                label : 'Clear All',
                command : 'resetCommand',
                group : 'geotyping-group',
                icon : CKEDITOR.getUrl(this.path + 'images/res1.png')
            });
        }

        if (editor.contextMenu) {
            editor.contextMenu.addListener(function(element, selection) {
                return {
                    gtMenuItem1 : CKEDITOR.TRISTATE_ON,
                    gtMenuItem2 : CKEDITOR.TRISTATE_ON,
                    gtMenuItem3 : CKEDITOR.TRISTATE_ON,
                    gtMenuItem4 : CKEDITOR.TRISTATE_ON
                };
            });
        }
    }
});