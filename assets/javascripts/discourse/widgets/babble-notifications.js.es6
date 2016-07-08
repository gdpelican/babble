import { createWidget } from 'discourse/widgets/widget';
import template from '../widgets/templates/babble-notifications'

export default createWidget('babble-notifications', {
  defaultState(attrs) {
    const {notifications} = attrs
    return {notifications}
  },

  html() { return template.render(this) },
})
