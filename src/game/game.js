/**
 * This class handles communication from/to the game server.
 *
 * To handle incoming message, create a method named `message_in_` then the
 * message's action, replacing dashes by underscores. As example, if a
 * `set-uuid` message is received, the `message_in_set_uuid` method will be
 * called. It will get the whole message as argument.
 *
 * Most of these methods should not be used directly. Instead, use actions
 * defined in the MorelStore module.
 */
const MorelClient = class {

  /**
   * Constructor.
   *
   * @param {string} ws_url The websocket URL to connect to.
   * @param {string} protocol The protocol to expose to the websocket.
   */
  constructor(ws_url, protocol) {
    this.ws_url = ws_url
    this.protocol = protocol || 'morel-protocol'

    this.runtime_server_identifier = null

    this.client = null
    this.client_uuid = null
    this.secret = null

    // The client won't try to automatically reconnect if the connection is lost
    // after a kick.
    this.kicked = false
  }

  /**
   * Sets the VueX store to use to store data.
   *
   * This store *must* contains a module named `morel` and created by
   * `MorelStore`. It *must* be set before the `connect()` call.
   *
   * @param {VueX.Store} store The VueX store.
   */
  set_store(store) {
    this.store = store
  }

  /**
   * Sets the UUID and secret sent by the server and sent back in every message.
   */
  set_uuid_and_secret(uuid, secret) {
    this.client_uuid = uuid
    this.secret = secret
    this.store.commit('morel/set_uuid', uuid)

    this.persist_credentials()
  }

  /**
   * Persists the UUID and secret into the session storage, to be able to
   * reconnect in the tab without loosing the link with out “account”.
   */
  persist_credentials() {
    // We must use sessionStorage, else the same UUID/secret may be
    // used between two tabs, and the server does not like this at
    // all (the first client kinda no longer exist for the server).
    // Also, this ensure we cannot track the player with its UUID,
    // as the browser will delete this as soon as the tab or the
    // browser is closed.
    sessionStorage.setItem(
      'morel-credentials',
      JSON.stringify({
        uuid: this.client_uuid,
        secret: this.secret
      })
    )
  }

  /**
   * Removes the persisted credentials from the session storage.
   */
  delete_persisted_credentials() {
    sessionStorage.removeItem('morel-credentials');
  }

  /**
   * Loads persisted credentials from the session storage.
   */
  load_persisted_credentials() {
    let credentials = sessionStorage.getItem('morel-credentials') || '';
    try {
      credentials = JSON.parse(credentials);
    } catch {
      return;
    }

    if (!credentials.uuid || !credentials.secret) {
      return;
    }

    this.set_uuid_and_secret(credentials.uuid, credentials.secret);
  }

  /**
   * Connects to the websocket using the pseudonym in the store.
   *
   * @return {Promise} A Promise that will be resolved when the connection is
   * successful.
   */
  connect() {
    this.load_persisted_credentials();
    this.kicked = false;

    return new Promise((resolve, reject) => {
      this.client = new WebSocket(this.ws_url, this.protocol);

      this.client.onerror = error => {
        console.error('WS initial connection error.');
        reject(error);
      };

      this.client.onopen = () => {
        resolve();
      };

      this.client.onclose = () => {
        this.client.close();

        if (!this.kicked) {
          this.store.dispatch('morel/disconnected_from_socket');
          setTimeout(() => this.reconnect(), 2000);
        }
      };

      this.client.onmessage = message => {
        if (typeof message.data !== 'string') {
          console.warn(
            'Ignored non-string message received through websocket.',
            message
          );
          return;
        }

        let data = null;

        try {
          data = JSON.parse(message.data);
        } catch (error) {
          return;
        }

        if (!data.action) {
          return;
        }

        this.handle_message(data.action, data);
      };
    });
  }

  /**
   * Reconnects to the game if the connection is lost.
   *
   * @return {Promise} A Promise resolved when the connection is re-established.
   */
  reconnect() {
    return this.connect()
      .then(() => this.join_game())
      .then(() => {
        this.store.dispatch('morel/reconnect_to_socket');

        // We clear the players, as the server will re-send all login messages
        // for other players.
        this.store.commit('morel/clear_players');
    })
  }

  /**
   * Sends a message through the websocket.
   *
   * Credentials will automatically be injected.
   *
   * @param {string} action The message's action.
   * @param {object} message The payload; can be any JSON-serializable object.
   *
   * @return {Promise} A Promise resolved when the message is successfully sent.
   * If the connection is broken, the promise is rejected with "disconnected".
   */
  send_message(action, message) {
    return new Promise((resolve, reject) => {
      if (this.client.readyState == this.client.OPEN) {
        message = message || {}

        message.action = action
        message.uuid = this.client_uuid
        message.secret = this.secret
        message.slug = this.store.state.morel.slug

        this.client.send(JSON.stringify(message))
        resolve()
      } else {
        reject('disconnected')
      }
    })
  }

  /**
   * Internal method to handle an incoming message and call the appropriate
   * method.
   *
   * @param {string} action The incoming message's action.
   * @param {object} message The received payload.
   */
  handle_message(action, message) {
    let method_name = 'message_in_' + action.replace(/\-/g, '_').trim().toLowerCase()

    if (typeof this[method_name] === 'function') {
      this[method_name](message);
    }
  }

  message_in_set_server_runtime_identifier({ runtime_identifier }) {
      // If we don't have an identifier stored, we store it. Else,
      // if the identifier is different (during a reconnection), we
      // reload the page. This is used when the game server restarts
      // (and the client stays active), or when we re-use a tab after
      // a long pause and the user expired server-side.
      if (!this.runtime_server_identifier) {
        this.runtime_server_identifier = runtime_identifier
      } else if (this.runtime_server_identifier !== runtime_identifier) {
        this.store.dispatch('morel/reload_required')
        this.delete_persisted_credentials()
        setTimeout(() => document.location.reload(), 10000)
      }
  }

  message_in_set_uuid({ uuid, secret }) {
    this.set_uuid_and_secret(uuid, secret)
  }

  message_in_kick({ locked }) {
    this.store.commit('morel/set_kick_reason', locked ? 'locked': 'kicked')
    this.store.commit('morel/set_phase', 'PSEUDONYM')

    this.kicked = true
  }

  message_in_set_slug({ slug }) {
    this.store.dispatch('morel/set_slug', slug)
  }

  message_in_set_master({ master }) {
    this.store.dispatch('morel/update_master', master.uuid)
  }

  message_in_player_join({ player }) {
    player.ourself = this.client_uuid === player.uuid
    this.store.dispatch('morel/player_join', player)
  }

  message_in_player_left({ player }) {
    this.store.dispatch('morel/player_left', player.uuid)
  }

  message_in_config_updated({ configuration }) {
    this.store.commit('morel/update_configuration', configuration)
  }

  message_in_game_locked({ locked }) {
    this.store.commit('morel/set_lock', !!locked)
    this.store.commit('morel/set_lock_loading', false)
  }

  message_in_player_ready({ player, ready }) {
    this.store.commit('morel/change_player_readyness', {
      uuid: player.uuid,
      ready: ready === undefined || ready === null ? true : !!ready
    })
  }

  /**
   * Asks the server to join the game. The pseudonym must be set in the store,
   * and the client must be connected.
   *
   * @return {Promise} A Promise resolved when the message is sent.
   */
  join_game() {
    return this.send_message('join-game', {
      pseudonym: this.store.state.morel.pseudonym
    })
  }

  /**
   * Sends to the server the current configuration.
   *
   * If the player is not master, the message will be rejected by the server.
   * This method will not check that and send the message anyway.
   *
   * @return {Promise} A Promise resolved when the message is sent.
   */
  send_config_update() {
    return this.send_message('update-config', {
      configuration: this.store.state.morel.configuration
    })
  }

  /**
   * Asks the server to lock or unlock the game.
   *
   * If the player is not master, the message will be rejected by the server.
   * This method will not check that and send the message anyway.
   *
   * @return {Promise} A Promise resolved when the message is sent.
   */
  lock_game(locked) {
    return this.send_message('lock-game', { locked })
  }

  /**
   * Asks the server to change the master player.
   *
   * If the player is not master, the message will be rejected by the server.
   * This method will not check that and send the message anyway.
   *
   * @return {Promise} A Promise resolved when the message is sent.
   */
  switch_master(new_master_uuid) {
    return this.send_message('switch-master', {
      master: {
        uuid: new_master_uuid
      }
    })
  }

  /**
   * Asks the server to kick a player.
   *
   * If the player is not master, the message will be rejected by the server.
   * This method will not check that and send the message anyway.
   *
   * @return {Promise} A Promise resolved when the message is sent.
   */
  kick_player(player_uuid) {
    return this.send_message('kick-player', {
      kick: {
        uuid: player_uuid
      }
    })
  }
}

exports.MorelClient = MorelClient
