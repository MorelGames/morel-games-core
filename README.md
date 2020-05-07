# Morel Games — Core

This package centralizes all common components for Morel games: authentication,
network, game URL, players list, master player, master actions (kick players,
lock game), and finally, internationalization. Pre-made Vue components are also
provided.

**[Documentation for JS API and Vue components](https://morelgames.github.io/morel-games-core)**

## Integration

On an existing Vue + Vuex project, you must:
- add a Vuex module;
- register Vue components;
- register i18n;
- create a game client.

The core depends on:
- Vue & Vuex, of course;
- Buefy (Bulma as Vue components);
- and Vue-i18n for internationalization.


### TL;DR

If you know what you are doing.

#### Game client

```js
import { MorelClient } from "morel-games-core"

export default class GameClient extends MorelClient {
  message_in_my_action(message) {
    this.send_message("the-answer", { answer: 42, music: "The Beatles" })
  }
}
```

#### Main

```js
import Vue from "vue"
import Vuex from "vuex"
import Buefy from "buefy"

import { MorelStore, MorelVue, MorelI18n } from "morel-games-core"

import GameClient from "./game" // Your game client here, extends MorelClient.
import App from "./App.vue"     // Your main App component.

// Icons
// Could be in icons.js

import { library } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

import {
  faCaretDown,
  faCaretUp,
  faCheck,
  faChevronRight,
  faClipboard
  faExclamationCircle,
  faHourglassHalf,
  faLock,
  faLockOpen,
  faTimes,
  faUserAltSlash,
  faUserShield
} from "@fortawesome/free-solid-svg-icons"

library.add(
  faCaretDown,
  faCaretUp,
  faCheck,
  faChevronRight,
  faClipboard
  faExclamationCircle,
  faHourglassHalf,
  faLock,
  faLockOpen,
  faTimes,
  faUserAltSlash,
  faUserShield
)

// Vue components registration

Vue.use(Vuex)
Vue.use(MorelVue)
Vue.use(Buefy, {
  defaultIconComponent: "vue-fontawesome",
  defaultIconPack: "fas"
})

Vue.component("vue-fontawesome", FontAwesomeIcon)

// Client & I18n instanciation

const client = new GameClient(
  process.env.VUE_APP_WS_URL.replace("{hostname}", document.location.hostname),
  "your-protocol"
)

const i18n = new MorelI18n(
  locale =>
    import(
      /* webpackChunkName: "locales-[request]" */ "./../locales/" +
        locale +
        ".json"
    ),
  {
    en: "English",
    fr: "Français"
  }
)

// Store
// Could be in store.js

const store = new Vuex.Store({
  modules: {
    morel: MorelStore(client, i18n)
  },
  state: {
    // …
  }
})

// Client & I18n finalization

client.set_store(store)
i18n.set_store(store)

i18n.load_locale_from_browser()

// Slug initialization

const url_slug = window.location.pathname.slice(1).split("/")[0]
if (url_slug) {
  store.dispatch("morel/set_slug", url_slug)
}

// And go

new Vue({
  render: h => h(App),
  store,
  i18n: i18n.i18n
}).$mount("#app")
```


### Game client

The game client is a class that connects to the game server and handles all
incoming and sent messages. The core contains a base class for that; it
handle all base messages and authentication injection, and provides you with
communication methods and auto-listeners.

The protocol is defined in [`morel-base-protocol.md`](./morel-base-protocol.md).

To create a client, create a class that extends the `MorelClient` class.

```js
import { MorelClient } from "morel-games-core"

export default class GameClient extends MorelClient {

}
```

You already have a game client that can connect to a Morel-compatible game
server and handle everything mentioned in the introduction (like players
join & leave, kicks, masters, masters switches, …).

The class also handles reconnection automatically for you.

#### Listening for messages

To listen for your own specific incoming messages, you only need to create
methods with a specific name. As explained on the protocol, there is an action
for each message; to listen for an action, create a methods that start with
`message_in_`, then the action name, replacing dashes with underscores.

As example, to listen for the action `my-action`:

```js
export default class GameClient extends MorelClient {
  message_in_my_action(message) {
    // ...
  }
}
```

`message` will be the full JSON message received through the websocket. You can
also use object destructuring to simplify the code:

```js
message_in_my_action({ thing, thong }) {
  // ...
}
```

#### Sending messages

From any method, use the `send_message` method. The first argument is the
action, and the second (optional), the payload you want to send—that can be any
`object`. It returns a `Promise`, resolved when the message was successfully
sent.

As example, a simple echo client could be built like this:

```js
message_in_ping({ reply }) {
  this.send_message("pong", { pong: reply })
}
```

If a `ping` message is received, the `reply` parameter will be replied back
in a `pong` outgoing message.

#### Using the store

The Vuex store is available in `this.store`, so you can mutate the store or
dispatch actions easily when incoming messages are received.

#### Creating a game client object

The game client constructor takes two arguments:
- the websocket URL to connect to;
- the name of the protocol to expose to the websocket (defaults to
  `morel-protocol`, but you should change this).

You should instantiate the client _before_ the Vuex store, as the Morel store
depends on the client, but set the store after, like this:

```js
const client = new GameClient("wss://example.com", "example-protocol")

const store = Vuex.Store({ … })

client.set_store(store)
```


### I18n

The core integrates [Vue i18n](https://kazupon.github.io/vue-i18n/). A
full-featured class adds useful shortcut to change languages, and an UI
component is also provided (see the Vue Components section). The I18n class
require two arguments:
- a function that loads the i18n catalog for a given locale, and return a
  `Promise` that return it (that catalog is a JSON or JS file; ultimately any
  javascript object);
- an object containing the supported locales, the property being the locale code
  and the value the locale name _in its language_ (e.g. for `fr`,
  `Français` instead of `French`). The value will be used in the default
  locale switcher component as label.

We highly recommend to use Webpack's chunk feature (like below) to reduce the
size of the compiled javascript file by lazy-loading translation files. The
default implementation will display a small loader when the locale is loaded,
so even with a slow connection, the user will understand something is happening.
Also, the core's translation files are themselves lazy-loaded anyway.

The integration is similar to the game client's one: you instantiate the
`MorelI18n` class before the store (as the store needs it) and you set the store
afterwards, like this.

You should also call the `load_locale_from_browser` method after `set_store`. It
will restore the last locale used (as stored in the local storage), or detect
the browser's locale if the local storage is empty.

```js
import { MorelI18n } from "morel-games-core"

const i18n = new MorelI18n(
  locale =>
    import(
      /* webpackChunkName: "locales-[request]" */ "./../locales/" +
        locale +
        ".json"
    ),
  {
    en: "English",
    fr: "Français"
  }
)

const store = Vuex.Store({ … })

i18n.set_store(store)
i18n.load_locale_from_browser()
```

#### Using the I18n component

The underlying Vue-i18n component is available through the `i18n` property (that
is, `i18n.i18n` in the example above). It is automatically registered, so you
don't need to do anything to get all `$t` and other `<i18n>` Vue components
(see [Vue-i18n documentation](https://kazupon.github.io/vue-i18n/started.html)
for details).

Calling `i18n.i18n.t()` is kinda long, so you may want to create a shortcut.
Don't forget to bind it to the original class if you do so, like this:

```js
const t = i18n.i18n.t.bind(i18n.i18n)

// or in Vue components
const t = this.$t.bind(this)
```

#### Switching locale

Higher-level (recommended): use th `<morel-locale-switcher>` component (see
below).

High-level: dispatch the `morel/set_locale` action, with the locale as argument.

Low-level: call the `MorelI18n.load_locale` method. It returns a `Promise`,
resolved when the locale is fully loaded.

```js
// i18n being the MorelI18n instance.
i18n.load_locale(locale)
```


### Store

The Morel Core _requires_ that its store module is loaded in your Vuex store
under the `morel` name. Use the `MorelStore` method to construct the module; it
needs both the game client and the `MorelI18n` instance as argument.

```js
import { MorelStore } from "morel-games-core"

const store = new Vuex.Store({
  modules: {
    morel: MorelStore(client, i18n)
  },
  state: {
    // …
  }
})
```

Both the client and the i18n module will store data in the store.

The store provides multiple mutations, actions and getters under the `morel`
namespace.


### Vue components

A few components are provided for basic things, to speed things up. You'll get:
- `<morel-ask-pseudonym>`: the “what's your name” interface, and also, error
  messages if the player is kicked from the game of if it is locked;
- `<morel-players>`: the players list, with customizable buttons if needed be;
  - `<morel-player-action>`: an action button on the players list;
- `<morel-share-game>`: the “share game” box, with the copy link button, an
  invite, and the lock/unlock button;
- `<morel-locale-switcher>`: the switch locale dropdown.

To use them, `use` `MorelVue`:

```js
import { MorelVue } from "morel-games-core"

Vue.use(MorelVue)
```

You'll require a few FA icons:

```js
import { library } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

import {
  faCaretDown,
  faCaretUp,
  faCheck,
  faChevronRight,
  faClipboard
  faExclamationCircle,
  faHourglassHalf,
  faLock,
  faLockOpen,
  faTimes,
  faUserAltSlash,
  faUserShield
} from "@fortawesome/free-solid-svg-icons"

library.add(
  faCaretDown,
  faCaretUp,
  faCheck,
  faChevronRight,
  faClipboard
  faExclamationCircle,
  faHourglassHalf,
  faLock,
  faLockOpen,
  faTimes,
  faUserAltSlash,
  faUserShield
)

Vue.component("vue-fontawesome", FontAwesomeIcon)
```

Each component provide customization options through slots & props; see
[their documentation](https://morelgames.github.io/morel-games-core/vue/) for
details.

## Documentation

To update documentation in the `docs` folder, run

```
npm run docs
```

with development dependencies installed.
