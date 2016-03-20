## To contribute

- Fork it ( https://github.com/[my-github-username]/babble/fork )
- Create your feature branch (git checkout -b my-new-feature)
- Commit your changes (git commit -am 'Add some feature')
- Push to the branch (git push origin my-new-feature)
- Create a new Pull Request

## Testing

I'm going for a well-tested plugin on the backend here, as there will be some somewhat complicated logic and overridden behaviour going on in places.

To run the tests, navigate to the root of your Discourse fork, and run the tests from there

```
bundle exec rspec plugins/babble/spec
```

## Setup

To create a chat room, access Chats section in Admin Panel, and create a new channel in it.

Once you have a valid chat topic and refreshing the webpage, the bullhorn icon will appear in the navbar, and you're good to go!
