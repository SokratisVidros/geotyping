(function() {
	var gtDialog = function(editor) {
		return {
			title : 'Geotyping Settings',
			minWidth : '100px',
			minHeight : '100px',
			buttons : [ CKEDITOR.dialog.okButton ],
			onOk : function() {
				Geotyping.setGtArea(" "
						+ this
								.getContentElement('settingsTab',
										'gt-area-input').getValue());
				GoogleMapsModule.setMaximumZoomLevel(this.getContentElement(
						'settingsTab', 'gt-max-zoom-input').getValue());

				Geotyping.setConfig('useExternalParser', this
						.getContentElement('settingsTab',
								'gt-check-internal-parser').getValue());

				Geotyping.setRequestType(this.getContentElement('settingsTab',
						'gt-select-request-type').getValue());
			},
			onShow : function() {
				this.setupContent();
			},
			resizable : 'none',
			contents : [ {
				id : 'settingsTab',
				label : 'Settings',
				elements : [
						{
							type : 'text',
							id : 'gt-area-input',
							label : 'Geographical area: ',
							labelLayout : 'horizontal',
							setup : function(element) {
								this.setValue(Geotyping.getGtArea());
							}
						},
						{
							type : 'text',
							id : 'gt-max-zoom-input',
							label : 'Max zoom level: ',
							labelLayout : 'horizontal',
							setup : function(element) {
								this.setValue(GoogleMapsModule
										.getMaximumZoomLevel());
							},
							validate : CKEDITOR.dialog.validate
									.notEmpty('Max Zoom level: Enter a value between 0 and 20!')
						},
						{
							type : 'checkbox',
							id : 'gt-check-internal-parser',
							label : 'Use external parser: ',
							labelLayout : 'horizontal',
							setup : function(element) {
								this.setValue(Geotyping
										.getConfig('useExternalParser'));
							}
						},
						{
							type : 'select',
							id : 'gt-select-request-type',
							label : 'Request type: ',
							labelLayout : 'horizontal',
							items : [ [ 'GET ', 'GET' ], [ 'POST ', 'POST' ] ],
							setup : function(element) {
								this
										.setValue(Geotyping
												.getConfig('request').type);
							}
						} ]
			} ]
		};
	};

	CKEDITOR.dialog.add('geotyping-cke', function(editor) {
		return gtDialog(editor);
	});

})();