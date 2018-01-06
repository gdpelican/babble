# name: babble
# about: Shoutbox plugin for Discourse
# version: 3.1.7
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.scss"

enabled_site_setting :babble_enabled

def babble_require(path)
  require Rails.root.join('plugins', 'babble', 'app', path).to_s
end

babble_require 'extras/position_options'

after_initialize do

  babble_require 'initializers/babble'

  babble_require 'routes/babble'
  babble_require 'routes/discourse'

  babble_require 'controllers/controller'
  babble_require 'controllers/admin/chats_controller'
  babble_require 'controllers/topics_controller'
  babble_require 'controllers/posts_controller'

  babble_require 'serializers/notification_serializer'
  babble_require 'serializers/post_serializer'
  babble_require 'serializers/topic_serializer'

  babble_require 'services/post_creator'
  babble_require 'services/post_destroyer'
  babble_require 'services/post_revisor'
  babble_require 'services/broadcaster'
  babble_require 'services/post_stream_window'

  babble_require 'models/archetype'
  babble_require 'models/guardian'
  babble_require 'models/topic_query'
  babble_require 'models/topic'
  babble_require 'models/trash_panda_action'
  babble_require 'models/trash_panda_summary'

  Category.register_custom_field_type('chat_topic_id', :integer)
  add_to_serializer(:basic_category, :chat_topic_id) { object.custom_fields['chat_topic_id'] unless object.custom_fields['chat_topic_id'].to_i == 0 }
  add_to_serializer(:basic_topic, :category_id)      { object.category_id if object.respond_to?(:category_id) }

  class ::Topic
    module ForDigest
      def for_digest(trash_panda, since, opts=nil)
        super(trash_panda, since, opts).where('archetype <> ?', Archetype.chat)
      end
    end
    singleton_class.prepend ForDigest
  end

end
