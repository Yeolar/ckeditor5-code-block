/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module code-block/codeblockediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import CodeBlockCommand from './codeblockcommand';

/**
 * The code block editing.
 *
 * Introduces the `'codeBlock'` command and the `'codeBlock'` model element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class CodeBlockEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;

		editor.commands.add( 'codeBlock', new CodeBlockCommand( editor ) );

		schema.register( 'codeBlock', {
			allowWhere: '$block',
			allowContentOf: '$root'
		} );

		// Disallow codeBlock in codeBlock.
		schema.addChildCheck( ( ctx, childDef ) => {
			if ( ctx.endsWith( 'codeBlock' ) && childDef.name == 'codeBlock' ) {
				return false;
			}
		} );

		editor.conversion.elementToElement( { model: 'codeBlock', view: 'pre' } );
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const editor = this.editor;
		const command = editor.commands.get( 'codeBlock' );

		// Overwrite default Enter key behavior.
		// If Enter key is pressed with selection collapsed in empty block inside a block, break the block.
		// This listener is added in afterInit in order to register it after list's feature listener.
		// We can't use a priority for this, because 'low' is already used by the enter feature, unless
		// we'd use numeric priority in this case.
		this.listenTo( this.editor.editing.view.document, 'enter', ( evt, data ) => {
			const doc = this.editor.model.document;
			const positionParent = doc.selection.getLastPosition().parent;

			if ( doc.selection.isCollapsed && positionParent.isEmpty && command.value ) {
				this.editor.execute( 'codeBlock' );
				this.editor.editing.view.scrollToTheSelection();

				data.preventDefault();
				evt.stop();
			}
		} );
	}
}
