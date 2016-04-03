// Expanding Textareas v0.2.0
// MIT License
// https://github.com/bgrins/ExpandingTextareas

// NB: This is a modified version revamped to pack into an es6 module.
// All credit goes to bgrins :)

export default Ember.Object.create({
  initialize: function($textarea) {
    this.set('$textarea', $textarea)
    this.set('$textCopy', $('<span />'))
    this.set('$clone', $('<pre class="expanding-clone"><br /></pre>').prepend(this.get('$textCopy')))
    $textarea
      .wrap($('<div class="expanding-wrapper" style="position:relative" />'))
      .after(this.get('$clone'));

    this.attach()
    this.setStyles()
    this.update()
  },

  // Attaches input events
  // Only attaches `keyup` events if `input` is not fully suported
  attach: function () {
    this.get('$textarea').bind('input.expanding change.expanding', () => { this.update(); });
  },

  // Updates the clone with the textarea value
  update: function () {
    let $textarea = this.get('$textarea')
    this.get('$textCopy').text($textarea.val().replace(/\r\n/g, '\n'))

    // Use `triggerHandler` to prevent conflicts with `update` in Prototype.js
    $textarea.triggerHandler('update.expanding');
  },

  setStyles: function () {
    this._resetStyles();
    this._setCloneStyles();
    this._setTextareaStyles();
  },

  // Applies reset styles to the textarea and clone
  // Stores the original textarea styles in case of destroying
  _resetStyles: function () {
    let $textarea = this.get('$textarea')
    let $clone = this.get('$clone')
    this._oldTextareaStyles = $textarea.attr('style');

    $textarea.add($clone).css({
      margin: 0,
      webkitBoxSizing: 'border-box',
      mozBoxSizing: 'border-box',
      boxSizing: 'border-box',
      width: '100%'
    });
  },

  // Sets the basic clone styles and copies styles over from the textarea
  _setCloneStyles: function () {
    let $textarea = this.get('$textarea')
    let $clone    = this.get('$clone')

    var css = {
      display: 'block',
      border: '0 solid',
      visibility: 'hidden',
      minHeight: $textarea.outerHeight()
    };

    if ($textarea.attr('wrap') === 'off') css.overflowX = 'scroll';
    else css.whiteSpace = 'pre-wrap';

    $clone.css(css);
    this._copyTextareaStylesToClone();
  },

  _copyTextareaStylesToClone: function () {
    let $textarea = this.get('$textarea')
    let $clone    = this.get('$clone')

    let properties = [
      'lineHeight', 'textDecoration', 'letterSpacing',
      'fontSize', 'fontFamily', 'fontStyle',
      'fontWeight', 'textTransform', 'textAlign',
      'direction', 'wordSpacing', 'fontSizeAdjust',
      'wordWrap', 'word-break',
      'borderLeftWidth', 'borderRightWidth',
      'borderTopWidth', 'borderBottomWidth',
      'paddingLeft', 'paddingRight',
      'paddingTop', 'paddingBottom', 'maxHeight'
    ];

    $.each(properties, function (i, property) {
      var val = $textarea.css(property);

      // Prevent overriding percentage css values.
      if ($clone.css(property) !== val) {
        $clone.css(property, val);
        if (property === 'maxHeight' && val !== 'none') {
          $clone.css('overflow', 'hidden');
        }
      }
    });
  },

  _setTextareaStyles: function () {
    this.get('$textarea').css({
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      resize: 'none',
      overflow: 'auto'
    });
  }
})
