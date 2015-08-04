A Shoutbox style plugin for [Discourse](http://discourse.org).

[![Code Climate](https://codeclimate.com/github/gdpelican/babble/badges/gpa.svg)](https://codeclimate.com/github/gdpelican/babble)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/gdpelican/babble)



Currently still under development!

Things that work great:
- Sending messages to other clients
- Live updating of chat window with new messages
- Scrolling of window when opening dropdown / new messages come in
- Updating unread counter when a new message comes in
- Updating the read counter in the backend when posts are read
- Live updating the unread counter when posts are read

Things that work not-great:
- Updating last read line / scroll position when reopening chat dropdown
- Need to identify which stats are being updated (post count etc.), and which stats should be updated
- Likely other things; let me know!

Things that I'd like to add:
- Additional outlets for chat windows (sidebar, fixed floating window, etc.)
- Pagination (likely load previous page)
- Editing a recent post of yours
- Allowing user to mute chat notifications
- Adding a context switcher to allow for multiple chat threads
- Post timing tracking

Pull requests welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

You can view some ongoing discussion about this plugin on [Discourse Meta](https://meta.discourse.org/t/has-anyone-built-something-for-informal-status-updates-chat/10550)


[![Join the chat at https://gitter.im/gdpelican/babble](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/gdpelican/babble?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)