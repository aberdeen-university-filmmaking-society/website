/**
 *   CKAwesome 
 *   =========
 *   http://blackdevelop.com/io/ckawesome/
 *   
 *   Copyright (C) 2017 by Blackdevelop.com
 *   Licence under GNU GPL v3.
 */

CKEDITOR.on('instanceReady',function () { CKEDITOR.document.appendStyleSheet(CKEDITOR.plugins.getPath('ckawesome') + 'resources/select2/select2.full.min.css');   });
CKEDITOR.on('instanceReady',function () { CKEDITOR.document.appendStyleSheet(CKEDITOR.plugins.getPath('ckawesome') + 'dialogs/ckawesome.css');   });
CKEDITOR.scriptLoader.load(CKEDITOR.plugins.getPath('ckawesome') + 'resources/select2/select2.full.min.js');
CKEDITOR.dtd.$removeEmpty.span = 0;
CKEDITOR.plugins.add('ckawesome', {
    requires: 'colordialog',
    icons: 'ckawesome',
    
    init: function(editor) {
    	var config = editor.config;
    	editor.fontawesomePath = config.fontawesomePath ? config.fontawesomePath : '//use.fontawesome.com/releases/v5.8.1/css/all.css';

    	CKEDITOR.document.appendStyleSheet(editor.fontawesomePath);
    	if( editor.addContentsCss ) {
			editor.addContentsCss(editor.fontawesomePath);
		}
    	
        CKEDITOR.dialog.add('ckawesomeDialog', this.path + 'dialogs/ckawesome.js');
        editor.addCommand( 'ckawesome', new CKEDITOR.dialogCommand( 'ckawesomeDialog', { allowedContent: 'span[class,style]{color,font-size}(*);' }));
        editor.ui.addButton( 'ckawesome', {
              label: 'Insert CKAwesome',
              command: 'ckawesome',
              toolbar: 'insert',
        });
    }
});
