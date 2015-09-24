A Shoutbox style plugin for [Discourse](http://discourse.org).

[![Code Climate](https://codeclimate.com/github/gdpelican/babble/badges/gpa.svg)](https://codeclimate.com/github/gdpelican/babble)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/gdpelican/babble)

Currently still under development!

#### Demo

Check out a live instance of Discourse with Babble installed on it here: [http://discourse-babble.com](http://discourse-babble.com)
(You'll have to make an account to see the chat)

#### Installation
 - Edit your web template and add the project clone url. (https://meta.discourse.org/t/install-a-plugin/19157)
 - Rebuild your web container so that the plugin installs.
 - In your Discourse setup, ensure that the option "allow uncategorized topics" is checked, otherwise the babble topic creation step you need to perform WILL fail.

#### Adding a chat channel
 - Enter your running web container and launch the rails console.
   - [sudo] ./launcher enter app
   - rails c
 - In order to create a topic, you'll need to specify a name and (optionally) a group which has access to the chat.
 - The syntax looks like this: `Babble::Topic.create_topic("<your topic name>", Group.find_by(name: "<your group name>"))`
   - Some options for existing group names include 'staff', 'trust_level_<0-4>', 'admins'. You can check out a list of all of the group names in your app with the following command: `Group.all.pluck(:name)`
   - Things to note:
     - If you do not specify a group, the chat will default to trust_level_0, ie anyone with an account can see and post in the chat.
     - The topic name must be a valid Discourse topic name, ie. it must be at least your instance's `min_topic_title_length` characters long (this value defaults to 15).
 - Once you've created your topic(s), exit the console by typing 'exit'. Exit the container by typing 'exit' again.

#### Things that work great
- Sending messages to other clients
- Live updating of chat window with new messages
- Scrolling of window when opening dropdown / new messages come in
- Updating unread counter when a new message comes in
- Updating the read counter in the backend when posts are read
- Live updating the unread counter when posts are read
- Having multiple chat channels
- Configuring channels to be accessible to certain groups of people
- Emojis!

#### Things that work not-great
- Posting to chat currently counts as a user post, which appears in a user's /posts page, counts towards badges, etc., which is not the best.
- Chat responsiveness is still a bit slower than I'd like
- Likely other things; let me know!

Things that I'd like to add:
- Pagination (likely load previous page)
- Editing a recent post of yours
- Allowing user to mute chat notifications

Pull requests welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

You can view some ongoing discussion about this plugin on [Discourse Meta](https://meta.discourse.org/t/babble-a-chat-plugin/31753)
