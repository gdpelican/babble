import Babble from "../lib/babble";
import MountWidget from "discourse/components/mount-widget";
import { on, observes } from "discourse-common/utils/decorators";
import debounce from "discourse/plugins/babble/lib/debounce";
import { throttle } from "@ember/runloop";

var whosOnline;

if (Discourse.SiteSettings.whos_online_enabled) {
  whosOnline = Ember.inject.service("online-service");
}

export default MountWidget.extend({
  widget: "babble-sidebar",
  availableTopics: [],
  availableUsers: [],
  whosOnline: whosOnline,

  buildArgs() {
    if (Babble.disabled()) {
      return {};
    }
    return {
      topic: this.topic,
      mobile: this.site.isMobileDevice,
      initialized: this.initialized,
      canInitialize:
        Discourse.SiteSettings.babble_enable_pms ||
        Babble.summary.topicCount > 0,
      availableTopics: Babble.availableTopics(),
      availableUsers: Babble.availableUsers(),
      visible: this.initialized && this.visible,
      csrf: this.session.get("csrfToken"),
      isOnline: (userId) => {
        if (!this.get("whosOnline")) {
          return;
        }
        return this.get("whosOnline").isUserOnline(userId);
      },
    };
  },

  @on("didInsertElement")
  _initialize() {
    if (Babble.disabled()) {
      return;
    }

    this.set("targetObject", this);

    $(window).on("resize.babble-window-resize", () =>
      debounce(this, this.triggerRerender, 250)
    );

    if (Discourse.SiteSettings.babble_adaptive_height) {
      $(window).on("scroll.babble-scroll", () =>
        throttle(this, this.triggerRerender, 250)
      );
    }

    this.appEvents.on("babble-toggle-chat", () => {
      this.visible ? this.closeChat() : this.openChat();
    });

    this.appEvents.on("babble-rerender", () => {
      this.dirtyKeys.forceAll();
      this.rerenderWidget();
    });

    this.appEvents.on("babble-has-topics", () => {
      if (!Babble.openByDefault() || this.site.isMobileDevice) {
        return;
      }
      this.initialize();
    });

    Babble.subscribeToNotifications(this);
    Babble.loadSummary(this);
  },

  @on("willDestroyElement")
  _teardown() {
    $(window).off("resize.babble-window-resize");
    $(window).off("scroll.babble-scroll");
    this.appEvents.off("babble-toggle-chat");
    this.appEvents.off("babble-rerender");
  },

  @observes("visible")
  _updateOutletClass() {
    const $outlet = $("#main-outlet");
    if (this.visible) {
      $outlet.addClass(
        `chat-active--${Discourse.SiteSettings.babble_position}`
      );
    } else {
      $outlet.removeClass(
        `chat-active--${Discourse.SiteSettings.babble_position}`
      );
    }
    this.appEvents.trigger("babble-rerender");
  },

  initialize(topic) {
    if (this.initialized) {
      return;
    }
    this.set("initialized", true);

    Babble.loadBoot(this).then(() => {
      this.openChat(topic);
    });
  },

  triggerRerender() {
    this.appEvents.trigger("babble-rerender");
  },

  openChat(topic) {
    if (!this.initialized) {
      return this.initialize(topic);
    }

    if (!topic && Babble.singleChannel()) {
      if (this.defaultLoaded) {
        return this.openChat(Babble.fetchDefault());
      }

      Babble.loadTopic(Babble.summary.defaultId).then(() => {
        this.set("defaultLoaded", true);
        this.openChat();
      });
    } else {
      if (this.visible) {
        this.closeChat();
      }
      Babble.bind(this, topic);
      this.set("topic", topic);
      this.set("visible", true);
    }
  },

  closeChat() {
    this.set("visible", false);
    Babble.unbind(this);
  },

  channelView() {
    Babble.unbind(this);
  },
});
