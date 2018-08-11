/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module code-block/codeblock
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import CodeBlockEditing from './codeblockediting';
import CodeBlockUI from './codeblockui';

/**
 * The code block plugin.
 *
 * It loads the {@link module:code-block/codeblockediting~CodeBlockEditing code block editing feature}
 * and {@link module:code-block/codeblockui~CodeBlockUI code block UI feature}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class CodeBlock extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ CodeBlockEditing, CodeBlockUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'CodeBlock';
	}
}
