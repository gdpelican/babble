import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

export default createWidget('babble-composer', {
  tagName: 'li.babble-post-composer',

  html() {
    var parts = [];
    parts.push(h('.babble-post-composer-textarea', [
      h('textarea', {placeholder: 'placeholder', rows: 1})
    ]));

    if (this.errorMessage) {
      parts.push(h('span.babble-composer-error-message', I18n.t(this.errorMessage)))
    }

    parts.push(h('button.babble-submit.btn.btn-primary', I18n.t('babble.send')));

    // Chat buttons
    parts.push(h('button.btn.no-text.emoji', {
      title: 'Emoji :smile',
      'aria-label': 'Emoji :smile:'
    }, h('i.fa.fa-smile-o')))

    parts.push(h('button.btn.no-text.upload', {
      title: 'Upload',
      'aria-label': 'Upload',
    }, h('i.fa.fa-picture-o')))

    return parts;
  },
});
