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
rspec plugins/babble/spec
```

## Setup

Currently, installing this plugin on its own will not create a topic for chat.

In order to do this, you'll need to go into a rails console and run the following:

```
Babble::Topic.create_topic(title: "Your topic name")
```

This will create:

- A Discourse User which will serve as 'author' for this and future chat topics. (This makes it easy for us to keep track of which topics are chat topics)
- A Discourse Topic which will be marked as `visible: false` and saved.

Once you have a valid chat topic, the bullhorn icon will appear in the navbar, and you're good to go!
