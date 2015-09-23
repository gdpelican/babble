A Shoutbox style plugin for [Discourse](http://discourse.org).

[![Code Climate](https://codeclimate.com/github/gdpelican/babble/badges/gpa.svg)](https://codeclimate.com/github/gdpelican/babble)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/gdpelican/babble)

Currently still under development!

Installation:
 - Edit your web template and add the project clone url. (https://meta.discourse.org/t/install-a-plugin/19157)
 - Rebuild your web container so that the plugin installs.
 - In your Discourse setup, ensure that the option "allow uncategorized topics" is checked, otherwise the babble topic creation step you need to perform WILL fail.
 - Enter your running web container and launch the rails console.
   - [sudo] ./launcher enter app
   - rails c
 - In the rails console, enter: Babble::Topic.create_topic("your_babble_topic_name")
   - You should get green text in response to the above command, which starts off with `<Topic id: (a number)`
   - (If you see `<Topic id: nil`, try using a longer topic name; it needs to be at least as long as the `min_topic_title_length` site setting on your instance, which defaults to 15 characters.)
 - Exit the console by typing 'exit'. Exit the container by typing 'exit' again.

Things that work great:
- Sending messages to other clients
- Live updating of chat window with new messages
- Scrolling of window when opening dropdown / new messages come in
- Updating unread counter when a new message comes in
- Updating the read counter in the backend when posts are read
- Live updating the unread counter when posts are read

Things that work not-great:
- Need to identify which stats are being updated (post count etc.), and which stats should be updated
- Chat responsiveness is still slower than I'd like
- Likely other things; let me know!

Things that I'd like to add:
- Pagination (likely load previous page)
- Editing a recent post of yours
- Allowing user to mute chat notifications
- Adding a context switcher to allow for multiple chat threads
- Post timing tracking

Pull requests welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

You can view some ongoing discussion about this plugin on [Discourse Meta](https://meta.discourse.org/t/has-anyone-built-something-for-informal-status-updates-chat/10550)
