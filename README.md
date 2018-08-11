CKEditor 5 code block feature
========================================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-block-quote.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-block-quote)

This package implements code block support for CKEditor 5.

See https://github.com/ckeditor/ckeditor5/issues/436

## Usage

```
npm install https://github.com/Yeolar/ckeditor5-code-block
```

Update src/ckeditor.js with:

```js
import CodeBlock from '@Yeolar/ckeditor5-code-block/src/codeblock';

ClassicEditor.builtinPlugins = [
  ...
  CodeBlock
];

ClassicEditor.defaultConfig = {
  toolbar: {
    items: [
      ...
      'blockQuote',
      ...
    ]
  },
};
```

Then

```
npm run build
```

In your templates, add (depends highlight.js):

```html
<script src="/static/highlight/highlight.min.js"></script>
<link rel="stylesheet" type="text/css" href="/static/highlight/styles/default.css" />
<script>
$(document).ready(function() {
    hljs.configure({useBR: true});  // handle <br>

    $('pre p').each(function(i, block) {  // use <pre><p>
      hljs.highlightBlock(block);
    });
});
</script>
```

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
