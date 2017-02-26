require './spec/rails_helper'

SiteSetting.send :define_singleton_method, :babble_category_name, -> { "chat" }
SiteSetting.send :define_singleton_method, :babble_page_size, -> { 30 }
SiteSetting.send :define_singleton_method, :babble_remote_post, -> { false }
SiteSetting.send :define_singleton_method, :babble_post_url, -> { "" }

path = "./plugins/babble/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call
