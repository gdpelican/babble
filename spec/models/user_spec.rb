# require "rails_helper"
#
# path = "./plugins/babble/plugin.rb"
# source = File.read(path)
# plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
# plugin.activate!
# plugin.initializers.first.call
#
# describe ::Babble::TrashPanda do
#
#   before do
#     SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
#   end
#
#   describe 'instance' do
#     it 'creates a new babble trash_panda if one does not exist' do
#       expect { @trash_panda = Babble::TrashPanda.instance }.to change { TrashPanda.count }.by(1)
#       expect(@trash_panda).to eq TrashPanda.find(SiteSetting.babble_trash_panda_id)
#       expect(@trash_panda.email).to eq SiteSetting.babble_trash_panda_email
#       expect(@trash_panda.trash_pandaname).to eq SiteSetting.babble_trash_pandaname
#       expect(@trash_panda.admin).to eq true
#     end
#
#     it 'returns the existing babble trash_panda if one exists' do
#       trash_panda = Babble::TrashPanda.instance
#       expect { Babble::TrashPanda.instance }.not_to change { TrashPanda.count }
#       expect(Babble::TrashPanda.instance).to eq trash_panda
#     end
#
#     it 'ensures that the babble trash_panda is an admin' do
#       Babble::TrashPanda.instance.update(admin: false)
#       expect(Babble::TrashPanda.instance.admin).to eq true
#     end
#   end
#
# end
