const Vue = require('vue').default
const Snackbar = require('buefy').SnackbarProgrammatic

/**
 * A Vuex module with game data inside.
 *
 * This function generates the module from the client and the i18n wrapper.
 * Its return value must be added to your Vuex store as a module named `morel`
 * (important!).
 *
 * Due to JSDoc limitations, use the source code link below to look up all
 * mutations, actions and getters available.
 *
 * @param {MorelClient} client The Morel Client instance for the current game.
 * @param {MorelI18n} i18n The Morel I18n instance for the current game.
 *
 * @return {object} A Vuex module required by the Morel game core.
 */
const MorelStore = function(client, i18n) {
  const $t = i18n ? i18n.i18n.t.bind(i18n.i18n) : message => message

  return {
    namespaced: true,

    state: {
      /**
       * The game's slug. It will be `null` if not set yet (i.e. in the pseudonym
       * phase, if we create a game).
       */
      slug: null,

      /**
       * The current game phase. Standard phases are `PSEUDONYM` and `CONFIG`.
       * Others are up to you.
       */
      phase: 'PSEUDONYM',

      /**
       * The player's UUID, for server communication and to know who we are in
       * the players list. Will be `null` before the first communication with the
       * server and the `set-uuid` message.
       */
      uuid: null,

      /**
       * The player's pseudonym. This must be set before the connection to the
       * game server. It is automatically set by the standard ask pseudonym
       * component.
       */
      pseudonym: null,

      /**
       * The player's masterness. If true, the player is the game master and is
       * allowed to change the game settings and other things.
       * of course this is only for UI changes: the server will always check
       * if the player is really the game master.
       */
      master: false,

      /**
       * The players in the game, as an object with the key being the UUID, and
       * the value, an object with at least the following keys:
       * - master: true if this player is master;
       * - online: true if this player is online;
       * - ourself: true if this is ourself;
       * - pseudonym: a string containing the player's pseudonym;
       * - uuid: a string containing the player's UUID.
       *
       * If this object contains a `ready` property, a tickmark will be displayed
       * in the standard players list component.
       */
      players: {},

      /**
       * This object does not have a rigid structure—put anything relevant in
       * here. It will be sent / received by the configuration standard messages.
       */
      configuration: {},

      /**
       * Stores the lock status of the game. if true, the game is locked and
       * new players cannot join. Else, anyone can join.
       */
      locked: false,

      /**
       * This is used for the loading indicator in the default lock game
       * component. If true, the lock icon will display a loader instead.
       */
      lock_loading: false,

      /**
       * If kicked, can be “locked” or “kicked”.
       * Should be null if not kicked.
       */
      kick_reason: null,

      /**
       * A loading indicator that will be updated while (re)connecting. Use it
       * if you want.
       */
      loading: false,

      /**
       * The reason why the system is loading. Both title and subtitle may be
       * null, as we can load without any given explanation. This should not
       * happen if the loading system is only set by the morel core.
       */
      loading_reason: {
        title: null,
        description: null
      },

      /**
       * If there is an error, this will be filled with at least a title,
       * maybe a description.
       */
      error: {
        title: null,
        description: null
      },

      /**
       * An object containing the avaliable locales for this application. Keys
       * are locale codes (e.g. “fr”), and values, locales' *local* names (e.g.
       * “Français”).
       */
      locales: {},

      /**
       * `true` if a locale is being loaded.
       */
      locale_loading: false
    },

    getters:  {
      /**
       * Returns the number of players.
       */
      players_count: state => Object.keys(state.players).length,

      players_count_online: (s, getters) => getters.players_list_online.length,

      /**
       * Returns a list containing all players.
       */
      players_list: state => Object.values(state.players),

      /**
       * Returns a list containing all players, sorted by pseudonym.
       */
      players_list_sorted: state =>
        Object.values(state.players).sort((a, b) =>
          a.pseudonym.toLowerCase().localeCompare(b.pseudonym.toLowerCase())
        ),

      /**
       * Returns a list containing all online players.
       */
      players_list_online: (s, getters) =>
        getters.players_list.filter(player => player.online),

      /**
       * Returns the error object (title/description) if there is an error;
       * null else.
       */
      error: state => state.error.title ? state.error : null
    },

    mutations: {
      /**
       * Sets the slug of the game.
       */
      set_slug: (s, slug) => s.slug = slug,

      /**
       * Sets the phase of the game.
       */
      set_phase: (s, phase) => s.phase = phase,

      /**
       * Sets our own UUID.
       */
      set_uuid: (s, uuid) => s.uuid = uuid,

      /**
       * Sets our own pseudonym.
       */
      set_pseudonym: (s, pseudonym) => s.pseudonym = pseudonym,

      /**
       * Sets if we are the game master.
       */
      set_master: (s, is_master) => s.master = is_master,

      /**
       * Sets the game master from its UUID.
       */
      set_master_player: (s, master_uuid) => {
        Object.keys(s.players).forEach(uuid => {
          if (uuid === master_uuid) {
            s.players[uuid].master = true;
          } else {
            s.players[uuid].master = false;
          }
        });
      },

      /**
       * Adds a player, from an object the type described above.
       */
       add_player: (s, player) => Vue.set(s.players, player.uuid, player),

       /**
        * Removes a player from its UUID.
        */
       remove_player: (s, uuid) => Vue.delete(s.players, uuid),

       /**
        * Removes all players.
        */
       clear_players: s => s.players = {},

       /**
        * Removes all offline players.
        */
       clear_offline_players: s => {
         Object.values(s.players)
           .filter(player => !player.online)
           .map(player => player.uuid)
           .forEach(uuid => {
             Vue.delete(s.players, uuid);
           })
       },

       /**
        * Updates a player's online status. The argument is an object with
        * two keys:
        * - uuid: the player's UUID;
        * - online: `true` if the player is online; false else.
        */
       change_player_online_status: (s, { uuid, online }) => {
         s.players[uuid].online = online
       },

       /**
        * Updates a player's pseudonym. The argument is an object with
        * two keys:
        * - uuid: the player's UUID;
        * - pseudonym: the pseudonym.
        */
       change_player_pseudonym: (s, { uuid, pseudonym }) => {
         s.players[uuid].pseudonym = pseudonym
       },

       /**
        * Updates a player's readyness, if this makes sense, by updating the
        * `ready` property. The argument is an object with two keys:
        * - uuid: the player's UUID;
        * - ready: `true` if ready; `false` else.
        */
       change_player_readyness: (s, { uuid, ready }) => {
         s.players[uuid].ready = ready
       },

       set_kick_reason: (s, reason) => s.kick_reason = reason,

       /**
        * Updates the configuration. The argument is the whole config object.
        */
       update_configuration: (s, config) => s.configuration = config,

       /**
        * Sets if the game is locked or not.
        */
       set_lock: (s, locked) => s.locked = locked,

       /**
        * Sets if the game is being locked or not (to display the loading
        * indicator).
        */
       set_lock_loading: (s, locking) => s.lock_loading = locking,

       /**
        * Enables or disables loading mode.
        *
        * To enable loading, the argument can either be:
        * - a truthy value, to enable it without reason;
        * - a string, to enalble it with a reason;
        * - an object with a `title` and a `description`, to enable it with a
        *   descriptive reason.
        *
        * To disable loading, the argument must be a falsy value.
        *
        * Please note: this will only keep track of the loading status, but
        * this library does not include any renderer for this. You must
        * implement it yourself using this as a data source.
        */
       set_loading: (s, loading) => {
         s.loading = !!loading
         s.loading_reason = {
           title: typeof loading === 'string' ? loading : (loading.title || null),
           description: loading.description || null
         }
       },

       /**
        * Enables or disables error mode.
        *
        * To enable loading, the argument can either be:
        * - a truthy value, to enable it without reason;
        * - a string, to enalble it with a reason;
        * - an object with a `title` and a `description`, to enable it with a
        *   descriptive reason.
        *
        * To disable loading, the argument must be a falsy value.
        *
        * Please note: this will only keep track of the loading status, but
        * this library does not include any renderer for this. You must
        * implement it yourself using this as a data source.
        */
       set_error: (s, error) => {
         if (!error) {
           s.error = null
         } else {
           s.error = {
             title: typeof error === 'string' ? error : (error.title || null),
             description: error.description || null
           }
         }
       },

       /**
        * Sets available locales in the application.
        * See state.locales documentation for format.
        */
       set_locales: (s, locales) => s.locales = locales,

       /**
        * Sets if a locale is being loaded.
        */
       set_locale_loading: (s, loading) => s.locale_loading = loading
    },

    actions: {
      /**
       * Sets the pseudonym of the player in the store, and connects to the
       * game server.
       *
       * @param {string} pseudonym The pseudonym.
       */
      set_pseudonym_and_connect(context, pseudonym) {
        context.commit("set_pseudonym", pseudonym);
        context.commit("set_loading", $t("Connecting…"));

        context.commit("set_kick_reason", null);

        client
          .connect()
          .then(() => {
            client.join_game().then(() => {
              context.commit("set_loading", false);
              context.commit("set_phase", "CONFIG");
            });
          })
          .catch(error => {
            console.error("Unable to connect to websocket server.", error);

            context.commit("set_loading", false);

            Snackbar.open({
              message: $t("Unable to connect to the game."),
              indefinite: true,
              type: "is-danger",
              actionText: $t("Retry"),
              onAction: () =>
                store.dispatch("set_pseudonym_and_connect", pseudonym)
            });
          });
      },

      set_slug(context, slug) {
        const slug_changed = slug !== context.state.slug;

        // If the player was connected to a different game than asked
        if (context.state.slug && slug_changed && context.state.phase === "CONFIG") {
          Snackbar.open({
            message: $t("You asked to join non-existant game. We created a new one for you."),
            queue: false,
            actionText: null,
            duration: 5000
          });
        }

        context.commit("set_slug", slug);

        if (slug_changed) {
          window.history.pushState(null, '', `/${slug}`);
        }
      },

      player_join(context, player) {
        let state_player = context.state.players[player.uuid];
        if (!state_player) {
          context.commit("add_player", player);

          // The player is always ready, except if we're in the answers
          // part of a round.
          context.commit("change_player_readyness", {
            uuid: player.uuid,
            ready: true
          });
        } else {
          context.commit("change_player_online_status", {
            uuid: player.uuid,
            online: true
          });
          context.commit("change_player_pseudonym", {
            uuid: player.uuid,
            pseudonym: player.pseudonym
          });
        }

        if (player.ourself) {
          context.commit("set_master", player.master);
        }

        if (context.state.phase !== "CONFIG" && !player.ourself) {
          Snackbar.open({
            message: $t("{name} joined the game", { name: player.pseudonym }),
            queue: false,
            actionText: null
          });
        }
      },

      player_left(context, uuid) {
        let player = context.state.players[uuid];
        if (!player) return; // nothing to do

        if (context.state.phase === "CONFIG") {
          context.commit("remove_player", uuid);
        } else {
          context.commit("change_player_online_status", {
            uuid: uuid,
            online: false
          });
        }

        Snackbar.open({
          message: $t("{name} left the game", { name: player.pseudonym }),
          queue: false,
          actionText: null
        });
      },

      update_master(context, master_uuid) {
        context.commit("set_master_player", master_uuid);
        context.commit("set_master", context.state.uuid === master_uuid);

        if (context.state.master) {
          Snackbar.open({
            message: $t("You are now the Game Master"),
            queue: false,
            actionText: null
          });
        }
      },

      switch_master(context, new_master_uuid) {
        if (!context.state.master) return;
        client.switch_master(new_master_uuid);
      },

      kick_player(context, player_uuid) {
        if (!context.state.master) return;
        client.kick_player(player_uuid);
      },

      update_game_configuration(context, configuration) {
        context.commit("update_configuration", configuration);
        client.send_config_update();
      },

      lock_game(context, locked) {
        if (context.state.master) {
          context.commit("set_lock_loading", true);
          client.lock_game(locked);
        }
      },

      set_all_readyness(context, players_uuids_ready) {
        players_uuids_ready.forEach(uuid =>
          context.commit("change_player_readyness", { uuid: uuid, ready: true })
        );
      },

      reset_all_readyness(context) {
        Object.keys(context.state.players).forEach(uuid =>
          context.commit("change_player_readyness", { uuid: uuid, ready: false })
        );
      },

      disconnected_from_socket(context) {
        if (!context.state.loading) {
          context.commit("set_loading", {
            title: $t("Reconnecting…"),
            description:
              $t("The connection was lost, but we're trying to fix this problem.") + "<br />" + $t("<strong>If it doesn't work after a few seconds, try to reload the page</strong>—you won't lose your progress in the game.")
          });
        }
      },

      reconnect_to_socket(context) {
        context.commit("set_loading", false);
      },

      reload_required(context) {
        context.commit("set_error", {
          title: $t("Connection lost."),
          description:
            "<strong>" + $t("Reload the page to continue.") + "</strong><br />" + $t("The game server was restarted, or you stayed inactive (way) too long. The page will reload automatically in ten seconds.")
        });
      },

      set_locale(context, locale) {
        context.commit("set_locale_loading", true)
        i18n.load_locale(locale).then(() => context.commit("set_locale_loading", false))
      }
    }
  }
}

exports.MorelStore = MorelStore
