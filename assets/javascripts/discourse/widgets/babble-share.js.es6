import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-share'
import Babble from '../lib/babble'

export default createWidget('babble-share', {
  tagName: '#share-link.visible',

  defaultState(attrs) {
    const {post} = attrs
    return {link: location.protocol + "//" + location.host + post.get('shareUrl')}
  },

  html() {
    Ember.run.scheduleOnce('afterRender', this.afterRender.bind(this))
    return template.render(this)
  },

  afterRender() {
    const $share = $('#share-link input')
    $share.select().focus()
  },

  clickOutside() {
    Babble.set('sharedPostId', null)
    Babble.rerender()
  },
})

