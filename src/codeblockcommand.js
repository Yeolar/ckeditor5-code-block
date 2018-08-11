/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module code-block/codeblockcommand
 */

import Command from '@ckeditor/ckeditor5-core/src/command';

import Position from '@ckeditor/ckeditor5-engine/src/model/position';
import Element from '@ckeditor/ckeditor5-engine/src/model/element';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import first from '@ckeditor/ckeditor5-utils/src/first';

/**
 * The code block command plugin.
 *
 * @extends module:core/command~Command
 */
export default class CodeBlockCommand extends Command {
	/**
	 * Whether the selection starts in a code block.
	 *
	 * @observable
	 * @readonly
	 * @member {Boolean} #value
	 */

	/**
	 * @inheritDoc
	 */
	refresh() {
		this.value = this._getValue();
		this.isEnabled = this._checkEnabled();
	}

	/**
	 * Executes the command. When the command {@link #value is on}, all code blocks within
	 * the selection will be removed. If it is off, all selected blocks will be wrapped with
	 * a code block.
	 *
	 * @fires execute
	 */
	execute() {
		const model = this.editor.model;
		const doc = model.document;
		const schema = model.schema;
		const blocks = Array.from( doc.selection.getSelectedBlocks() );

		model.change( writer => {
			if ( this.value ) {
				this._removeBlock( writer, blocks.filter( findBlock ) );
			} else {
				const blocksToBlock = blocks.filter( block => {
					// Already blocked blocks needs to be considered while quoting too
					// in order to reuse their <bQ> elements.
					return findBlock( block ) || checkCanBeBlocked( schema, block );
				} );

				this._applyBlock( writer, blocksToBlock );
			}
		} );
	}

	/**
	 * Checks the command's {@link #value}.
	 *
	 * @private
	 * @returns {Boolean} The current value.
	 */
	_getValue() {
		const firstBlock = first( this.editor.model.document.selection.getSelectedBlocks() );

		// In the current implementation, the code block must be an immediate parent of a block element.
		return !!( firstBlock && findBlock( firstBlock ) );
	}

	/**
	 * Checks whether the command can be enabled in the current context.
	 *
	 * @private
	 * @returns {Boolean} Whether the command should be enabled.
	 */
	_checkEnabled() {
		if ( this.value ) {
			return true;
		}

		const selection = this.editor.model.document.selection;
		const schema = this.editor.model.schema;

		const firstBlock = first( selection.getSelectedBlocks() );

		if ( !firstBlock ) {
			return false;
		}

		return checkCanBeBlocked( schema, firstBlock );
	}

	/**
	 * Removes the block from given blocks.
	 *
	 * If blocks which are supposed to be "unblocked" are in the middle of a block,
	 * start it or end it, then the block will be split (if needed) and the blocks
	 * will be moved out of it, so other blocked blocks remained blocked.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 * @param {Array.<module:engine/model/element~Element>} blocks
	 */
	_removeBlock( writer, blocks ) {
		// Unblock all groups of block. Iterate in the reverse order to not break following ranges.
		getRangesOfBlockGroups( blocks ).reverse().forEach( groupRange => {
			if ( groupRange.start.isAtStart && groupRange.end.isAtEnd ) {
				writer.unwrap( groupRange.start.parent );

				return;
			}

			// The group of blocks are at the beginning of an <bQ> so let's move them left (out of the <bQ>).
			if ( groupRange.start.isAtStart ) {
				const positionBefore = Position.createBefore( groupRange.start.parent );

				writer.move( groupRange, positionBefore );

				return;
			}

			// The blocks are in the middle of an <bQ> so we need to split the <bQ> after the last block
			// so we move the items there.
			if ( !groupRange.end.isAtEnd ) {
				writer.split( groupRange.end );
			}

			// Now we are sure that groupRange.end.isAtEnd is true, so let's move the blocks right.

			const positionAfter = Position.createAfter( groupRange.end.parent );

			writer.move( groupRange, positionAfter );
		} );
	}

	/**
	 * Applies the block to given blocks.
	 *
	 * @private
	 * @param {module:engine/model/writer~Writer} writer
	 * @param {Array.<module:engine/model/element~Element>} blocks
	 */
	_applyBlock( writer, blocks ) {
		const blocksToMerge = [];

		// Block all groups of block. Iterate in the reverse order to not break following ranges.
		getRangesOfBlockGroups( blocks ).reverse().forEach( groupRange => {
			let block = findBlock( groupRange.start );

			if ( !block ) {
				writer.wrap( groupRange, new Element( 'codeBlock' ) );
				block = groupRange.start.nodeAfter;
			}

			blocksToMerge.push( block );
		} );

		// Merge subsequent <bQ> elements. Reverse the order again because this time we want to go through
		// the <bQ> elements in the source order (due to how merge works – it moves the right element's content
		// to the first element and removes the right one. Since we may need to merge a couple of subsequent `<bQ>` elements
		// we want to keep the reference to the first (furthest left) one.
		blocksToMerge.reverse().reduce( ( currentBlock, nextBlock ) => {
			if ( currentBlock.nextSibling == nextBlock ) {
				writer.merge( Position.createAfter( currentBlock ) );

				return currentBlock;
			}

			return nextBlock;
		} );
	}
}

function findBlock( elementOrPosition ) {
	return elementOrPosition.parent.name == 'codeBlock' ? elementOrPosition.parent : null;
}

// Returns a minimal array of ranges containing groups of subsequent blocks.
//
// content:         abcdefgh
// blocks:          [ a, b, d , f, g, h ]
// output ranges:   [ab]c[d]e[fgh]
//
// @param {Array.<module:engine/model/element~Element>} blocks
// @returns {Array.<module:engine/model/range~Range>}
function getRangesOfBlockGroups( blocks ) {
	let startPosition;
	let i = 0;
	const ranges = [];

	while ( i < blocks.length ) {
		const block = blocks[ i ];
		const nextBlock = blocks[ i + 1 ];

		if ( !startPosition ) {
			startPosition = Position.createBefore( block );
		}

		if ( !nextBlock || block.nextSibling != nextBlock ) {
			ranges.push( new Range( startPosition, Position.createAfter( block ) ) );
			startPosition = null;
		}

		i++;
	}

	return ranges;
}

// Checks whether <pre> can wrap the block.
function checkCanBeBlocked( schema, block ) {
	// TMP will be replaced with schema.checkWrap().
	const isCBAllowed = schema.checkChild( block.parent, 'codeBlock' );
	const isBlockAllowedInCB = schema.checkChild( [ '$root', 'codeBlock' ], block );

	return isCBAllowed && isBlockAllowedInCB;
}
