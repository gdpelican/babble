import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import Babble from 'discourse/plugins/babble/discourse/lib/babble'

export default createWidget('babble-menu', {
  tagName: 'li.babble-menu',

  panelContents() {
    let topic = Babble.currentTopic
    return [
      h('.babble-menu-modals'),
      h('.babble-chat', [
        h('.babble-title-wrapper', [
          h('.babble-title', [
            h('h4.babble-group-title', topic.title),
            h('.babble-context-toggle.for-chat', [
              h('button.normalized', [
                h('i.fa.fa-eye')
              ]),
              h('span.babble-context-toggle-tooltip', I18n.t('babble.topic_visibility_tooltip', { groupNames: topic.group_names }))
            ])
          ])
        ])
      ]),
      h('ul.babble-posts', this.getPosts(topic.postStream.posts)),
      this.attach('babble-composer', { topic: topic })
    ];
  },

  getPosts(posts) {
    let postsHtml = []
    if (posts.length == 0) {
      postsHtml.push(h('li.babble-empty-topic-message', I18n.t('babble.empty_topic_message')))
    }
    posts.forEach(function(post) {
      postsHtml.push(h('li.temp_post', 'Hi, I am a post'))
      // this.attach('babble-post', { post: post }) TODO: write the babble-post widget
    })

    return h('ul.babble-posts', postsHtml)
  },

  html() {
    return this.attach('menu-panel', { contents: this.panelContents.bind(this) });
  },

  clickOutside() {
    this.sendWidgetAction('toggleBabble');
  }
});

// {{#menu-panel visible=visible}}
//   <div class='babble-menu-modals'>
//     {{babble-upload sendLinkedImage="sendLinkedImage" visible=showUpload}}
//   </div>
//   <section class="babble-chat">
//     <div {{bind-attr class=":babble-title-wrapper viewingChat"}}>
//       <div class="babble-title">
//         {{#if viewingChat}}
//           <h4 class="babble-group-title">{{currentTopic.title}}</h4>
//           <div class="babble-context-toggle for-chat">
//             <button class="normalized">
//               <i class="fa fa-eye" />
//             </button>
//             <span class="babble-context-toggle-tooltip">{{i18n 'babble.topic_visibility_tooltip' groupNames=currentTopic.group_names}}</span>
//           </div>
//           {{#if multipleTopicsAvailable}}
//           <div class="babble-context-toggle for-chat">
//             <button {{action 'viewTopics' bubbles=false}} class="normalized">
//               <i class="fa fa-exchange" />
//             </button>
//             <span class="babble-context-toggle-tooltip">{{i18n 'babble.view_topics_tooltip'}}</span>
//           </div>
//           {{/if}}
//         {{else}}
//           <button {{action 'viewChat' bubbles=false}} class="babble-context-toggle for-topics normalized">
//             <i class="fa fa-chevron-left" title="{{i18n 'babble.view_chat_tooltip'}}"></i>
//           </button>
//           <h4 class="babble-topic-switcher-title">{{i18n 'babble.select_topic'}}</h4>
//         {{/if}}
//       </div>
//     </div>
//
//     {{#if viewingChat}}
//       <ul class="babble-posts">
//         {{#unless currentTopic.postStream.posts}}
//           <li class="babble-empty-topic-message">{{i18n 'babble.empty_topic_message'}}</li>
//         {{/unless}}
//         {{#each post in currentTopic.postStream.posts}}
//           {{babble-post post=post topic=currentTopic}}
//         {{/each}}
//         {{conditional-loading-spinner condition=currentTopic.postStream.loadingBelow}}
//       </ul>
//       {{babble-composer topic=currentTopic showUpload=showUpload linkedImage=sendLinkedImage}}
//     {{else}}
//       <ul class="babble-available-topics">
//         {{#each topic in availableTopics}}
//           <li class="babble-available-topic row">
//             <button {{action 'changeTopic' topic bubbles=false}} class="normalized">
//               <div class="babble-available-topic-title">{{topic.title}}</div>
//             </button>
//           </li>
//         {{/each}}
//       </ul>
//     {{/if}}
//   </section>
// {{/menu-panel}}
