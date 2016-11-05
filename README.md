A Shoutbox style plugin for [Discourse](http://discourse.org).

[![Code Climate](https://codeclimate.com/github/gdpelican/babble/badges/gpa.svg)](https://codeclimate.com/github/gdpelican/babble)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/gdpelican/babble)

#### Demo

Check out a live instance of Discourse with Babble installed on it here: [http://discourse-babble.com](http://discourse-babble.com)
(You'll have to make an account to see the chat)

#### Installation
 - Edit your web template and add the project clone url. (https://meta.discourse.org/t/install-a-plugin/19157)
 - Rebuild your web container so that the plugin installs.
 - NB: If you're running a recent version of Discourse (you should be!), you'll need to track the beta branch instead of master. To do this, use the following git clone url in your app.yml:

 ```
 - git clone -b beta https://github.com/gdpelican/babble.git
 ```

#### Adding a chat channel
This has been added to the admin panel; simply visit `/admin/chats` to create, update, and delete your chat channels.

**Experimental**: Full page chat mode!
There is now a site setting for 'full page' chat mode in Babble. This will allow you to tie chat channels to a particular category, and expose a 'chat' route within your category, like so:

![](screenshots/header.png)

To do this, visit the `admin/chats` route, select 'Make a New Channel', and create a chat with 'category' permissions.
![](screenshots/admin.png)

NB that you can still create group-based chats, which will appear as normal in Shoutbox mode, by selecting 'group' permissions.

To switch between 'Shoutbox' mode (with the icon in the header), and 'Full page' mode (with chats linked to a category), use the 'Use full page chat mode' plugin setting.

![](screenshots/settings.png)

- Check out the [issues list](http://github.com/gdpelican/babble/issues) for a more comprehensive list of what's not working great and what could be improved.

#### Translations

Babble is currently available in English, German, French, Spanish, Italian, Finnish, Russian, Polish, and Korean.
If you'd like it translated into your language, let me know! Babble is now [on Transifex](http://transifex.com/babble/babble), which should result in a better translation experience for all.

Pull requests welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

You can view some ongoing discussion about this plugin on [Discourse Meta](https://meta.discourse.org/t/babble-a-chat-plugin/31753)
