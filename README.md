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
 - This has been added to the admin panel; simply visit `/admin/chats` to create, update, and delete your chat channels.

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
