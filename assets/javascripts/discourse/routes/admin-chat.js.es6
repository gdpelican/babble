import Babble from "../../discourse/lib/babble"
import Topic from 'discourse/models/topic'
import Group from 'discourse/models/group'
import Category from 'discourse/models/category'
import { ajax } from 'discourse/lib/ajax'

export default Discourse.Route.extend({

  setupController: function(controller) {
    if (Babble.disabled()) { return }
    Group.findAll().then((groupsResponse) => {
      const id = this.paramsFor('adminChat').id

      // don't include the everyone group, and set automatic to false so groups can be removed
      let groups = _.reject(groupsResponse.map((g) => { g.automatic = false; return g; }), (g) => { return g.id == 0 })

      if (id === 'new') {
        controller.setProperties({ model: Topic.create(), available: groups, selected: [], categories: [] })
      } else {
        ajax(`/babble/topics/${id}.json`).then((data) => {
          let topic = Topic.create(data)
          topic.set('permissions', data.permissions)

          if(topic.get('permissions') == 'category') {
            topic.set('category', Category.findById(data.category_id))
            controller.setProperties({ model: topic, available: groups, selected: [], categories: [topic.get('category')] })
          } else {
            ajax(`/babble/topics/${id}/groups.json`).then((response) => {
              let selected = response.topics.map((g) => { g.automatic = false; return g }) // ...yeah whoops. This should be in a separate controller.
              topic.allowed_group_ids = _.pluck(selected, 'id')
              controller.setProperties({ model: topic, available: groups, selected: selected, categories: [] })
            })
          }
        })
      }
    })
  }
});
