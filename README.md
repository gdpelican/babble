A Shoutbox style plugin for [Discourse](http://discourse.org).

[![Code Climate](https://codeclimate.com/github/gdpelican/babble/badges/gpa.svg)](https://codeclimate.com/github/gdpelican/babble)

You can view some ongoing discussion about this plugin on [Discourse Meta](https://meta.discourse.org/t/babble-a-chat-plugin/31753)

#### Demo

Check out a live instance of Discourse with Babble installed on it here: [http://discourse-babble.com](http://discourse-babble.com)
(You'll have to make an account to see the chat)

#### Installation
Edit your web template and add the project clone url. Then, rebuild your web container so that the plugin installs. Check out the [official guide](https://meta.discourse.org/t/install-a-plugin/19157) for more info.

 ```
 - git clone https://github.com/gdpelican/babble.git
 ```

###### Adding a chat channel

To create a new channel, visit the `admin/chats` route, select 'Make a New Channel', and create a chat.

You can either create a channel available to a particular category, or one available to a set of groups.

###### Other usage notes

- Babble is now configured to appear as a sidebar, which should result in a better experience overall. You may choose whether it occupies the left or right side of the screen in the settings (On small screens, it will automatically expand to take up the whole screen)
- If you have a custom header, Babble may not play nicely with Discourse's somewhat complicated scrolling behaviour. To account for this, turn on the 'Babble Adaptive Height' setting under `/admin/site_settings/category/plugins?filter=babble`
- Your users can disable babble for themselves by selecting the 'Disable Babble chat completely' option under the 'Interface' section in their User preferences
- Babble also offers an option to play a notification sound when new messages are received

#### Contributing


###### Bug reports

Check out the [issues list](http://github.com/gdpelican/babble/issues) to take a look at known issues and report ones we don't know about yet.

###### Code

Pull requests welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

###### Translations

Babble is currently available in English, German, French, Spanish, Italian, Finnish, Russian, Polish, and Korean.
If you'd like it translated into your language, let me know! Babble is now [on Transifex](http://transifex.com/babble/babble), which should result in a better translation experience for all.


###### Donations

Babble is free and open source and always will be. If you feel you've gotten value from using it and would like to support the developer behind it, please use the link below. <3 <3

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=james.kiesel%40gmail.com&currency_code=USD&source=url)
