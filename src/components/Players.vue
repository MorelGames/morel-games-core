<template>
  <nav class="panel morel-players-list">
    <div class="panel-block" v-for="(player, i) in sorted_players" :key="i">
      <span class="panel-icon">
        <!--
          For each player, this slot contains the left icon. Binds `player`, the player associated with this icon.
        -->
        <slot name="icon" v-bind:player="player">
          <!-- An icon representing the player's readyness, if online; an offline icon, else. -->
          <b-icon
            pack="fas"
            icon="user-alt-slash"
            size="is-small"
            v-if="!player.online"
            key="ready"
          ></b-icon>
          <b-icon
            pack="fas"
            icon="check"
            size="is-small"
            v-else-if="player.ready"
            key="ready"
          ></b-icon>
          <b-icon
            pack="fas"
            icon="hourglass-half"
            size="is-small"
            v-else
            key="not-ready"
          ></b-icon>
        </slot>
      </span>

      <div class="panel-block-main">
        <!--
          For each player, this slot contains the main label. Binds `player`, the player currently displayed.
        -->
        <slot name="label" v-bind:player="player">
          <!-- Te player name and a “(you)” mark for the current player, localized. -->
          <span
            v-bind:class="{
              'is-offline': !player.online
            }"
            >{{ player.pseudonym }}</span
          >
          <span class="is-size-7 ourself-mark" v-if="player.ourself">{{ $t('(you)') }}</span>
        </slot>
      </div>

      <!--
        For each player, this slot contains additional control button, or any other content displayed to the right of the player's line. You can use `morel-player-action` to add buttons easily. You can disable default controls (kick, master) with the `default-icons` prop (set it to `false`). Binds `player`, the player associated with this control button.
      -->
      <slot name="actions" v-bind:player="player" />

      <template v-if="defaultIcons">
        <morel-player-action
          :label="$t('Kick this player')"
          icon="user-alt-slash"
          v-if="we_are_master && !player.master && player.online"
          @click="kick_player(player.uuid)" />
        <morel-player-action
          :label="player.master ? $t('Game Master') : $t('Promote as Game Master')"
          icon="user-shield"
          :permanent="player.master"
          v-if="player.master || (we_are_master && player.online)"
          @click="switch_master(player.uuid)" />
      </template>
    </div>
  </nav>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import PlayerAction from './PlayerAction.vue'

/**
 * `<morel-players />`
 *
 * This components displays the players list, plus actions on them if the player
 * is master. You can add your own action in a slot.
 */
export default {
  props: {
    /**
     * If true, will include all default icons (kick and game master).
     */
    "default-icons": {
      type: Boolean,
      // `true`
      default: true
    },

    /**
     * In the kick confirmation dialog, the title of the popup. {name} will be
     * replaced by the kicked player's name. Accepts HTML.
     * If null, will remove the title.
     */
    "kick-confirm-title": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the kick confirmation dialog, the main message of the popup. {name}
     * will be replaced by the kicked player's name. Accepts HTML.
     * If null, will remove the message.
     */
    "kick-confirm-message": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the kick confirmation dialog, another message displayed in gray under
     * the main message. {name} will be replaced by the kicked player's name.
     * Accepts HTML.
     * If null, will remove the help.
     */
    "kick-confirm-help": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the kick confirmation dialog, the label of the confirmation dialog
     * button to kick the player. {name} will be replaced by the kicked player's
     * name.
     */
    "kick-confirm-button-yes": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the kick confirmation dialog, the label of the confirmation dialog
     * button to cancel the kick. {name} will be replaced by the kicked player's
     * name.
     */
    "kick-confirm-button-no": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the title of the popup.
     * {name} will be replaced by the new master player's name. Accepts HTML.
     * If null, will remove the title.
     */
    "master-confirm-title": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the main message of the popup.
     * {name} will be replaced by the new master player's name. Accepts HTML.
     * If null, will remove the message.
     */
    "master-confirm-message": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the switch master confirmation dialog, another message displayed in
     * gray under the main message. {name} will be replaced by the new master
     * player's name. Accepts HTML.
     * If null, will remove the help.
     */
    "master-confirm-help": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the label of the confirmation
     * dialog button to masterize the player. {name} will be replaced by the new
     * master player's name.
     */
    "master-confirm-button-yes": {
      type: String,
      // A standard and localized text.
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the label of the confirmation
     * dialog button to cancel the masterization. {name} will be replaced by the
     * kicked player's name.
     */
    "master-confirm-button-no": {
      type: String,
      // A standard and localized text.
      default: ""
    },
  },
  computed: {
    ...mapState('morel', {
      players: state => state.players,
      we_are_master: state => state.master,
      our_uuid: state => state.uuid,
      locked: state => state.locked
    }),
    ...mapGetters('morel', {
      sorted_players: 'players_list_sorted',
      players_count: 'players_count'
    })
  },
  methods: {
    replace_name(text, def, name) {
      return (text != null ? (text || def) : '').replace(/{name}/g, name)
    },
    switch_master(uuid) {
      if (!this.we_are_master || uuid === this.our_uuid) return

      let player = this.players[uuid]
      if (!player || !player.online) return

      const $t = this.$t.bind(this)

      let message = this.replace_name(
        this.masterConfirmMessage,
        $t("<strong>{name}</strong> will be able to manage the game and its configuration. You'll lose those powers."),
        player.pseudonym
      )

      let help = this.replace_name(
        this.masterConfirmHelp,
        $t("The game master cannot cheat, only manage the game. It can also kick players and lock the game."),
        player.pseudonym
      )

      this.$buefy.dialog.confirm({
        title: this.replace_name(
          this.masterConfirmTitle,
          $t("Promote {name}?"),
          player.pseudonym
        ),
        message: `${message}<br /><br /><span class="has-text-grey">${help}</span>`,
        confirmText: this.replace_name(
          this.masterConfirmButtonYes,
          $t("Promote"),
          player.pseudonym
        ),
        cancelText: this.replace_name(
          this.masterConfirmButtonNo,
          $t("Stay Game Master"),
          player.pseudonym
        ),

        type: "is-primary",
        hasIcon: true,
        iconPack: "fas",
        icon: "user-shield",

        onConfirm: () => {
          this.$store.dispatch("morel/switch_master", uuid);
        }
      })
    },

    kick_player(uuid) {
      if (!this.we_are_master || uuid === this.our_uuid) return

      let player = this.players[uuid]
      if (!player || !player.online) return

      const $t = this.$t.bind(this)

      let message = this.replace_name(
        this.kickConfirmMessage,
        this.locked
          ? $t("<strong>{name}</strong> will be unable to join as long as the game is locked.")
          : $t("<strong>{name}</strong> will left the game, but will be able to re-join as the game is not locked."),
        player.pseudonym
      )

      let help = this.replace_name(
        this.kickConfirmHelp,
        this.locked
          ? $t("To unlock the game, use the lock icon above the share game button.")
          : $t("You can lock the game with the lock icon above the share game button."),
        player.pseudonym
      )

      this.$buefy.dialog.confirm({
        title: this.replace_name(
          this.kickConfirmTitle,
          $t("Kick {name}?"),
          player.pseudonym
        ),
        message: `${message}<br /><br /><span class="has-text-grey">${help}</span>`,
        confirmText: this.replace_name(
          this.kickConfirmButtonYes,
          $t("Kick"),
          player.pseudonym
        ),
        cancelText: this.replace_name(
          this.kickConfirmButtonNo,
          $t("I changed my mind"),
          player.pseudonym
        ),

        type: "is-danger",
        hasIcon: true,
        iconPack: "fas",
        icon: "user-alt-slash",

        onConfirm: () => {
          this.$store.dispatch("morel/kick_player", uuid);
        }
      })
    }
  },
  components: {
    "morel-player-action": PlayerAction
  }
}
</script>

<style lang="sass">
@import "~bulma/sass/utilities/_all"

.panel.morel-players-list
  border-radius: 5px

  +mobile
    margin-left: 1rem
    margin-right: 1rem

  .panel-block
    align-items: center

    &:first-child
      border-top-left-radius: 4px
      border-top-right-radius: 4px

    &:last-child
      border-bottom-left-radius: 4px
      border-bottom-right-radius: 4px

    .panel-icon, .panel-icon-right
      display: inline-block
      position: relative
      top: -2px

      width: 1em
      height: 1em

    .panel-block-main
      flex: 2

    .ourself-mark
      display: inline-block
      margin-left: .4em
      padding-top: .3em

    .is-master
      font-weight: bold
    .is-offline
      font-style: italic

    &:hover .morel-player-action-icon
      display: block

.dialog.modal .media-content p span
  font-weight: normal
</style>
