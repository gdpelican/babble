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

#### Things that I'd like to add:
- Pagination (likely load previous page)
- Editing a recent post of yours
- Allowing user to mute chat notifications
- Check out the [issues list](http://github.com/gdpelican/babble/issues) for a more comprehensive list of what's not working great and what could be improved.

#### Translations

Babble is currently available in English, German, French, Spanish, Italian, Finnish, Russian, and Korean.
If you'd like it translated into your language, let me know! The process is simple and easy, and I'm happy to help with it.

Pull requests welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

You can view some ongoing discussion about this plugin on [Discourse Meta](https://meta.discourse.org/t/babble-a-chat-plugin/31753)
