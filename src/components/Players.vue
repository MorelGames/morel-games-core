<template>
  <nav class="panel morel-players-list">
    <div class="panel-block" v-for="(player, i) in sorted_players" :key="i">
      <span class="panel-icon">
        <!--
          @slot For each player, this slot contains the left icon.
          @binding {object} player The player associated with this icon.
        -->
        <slot name="icon" v-bind:player="player">
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
          @slot For each player, this slot contains the main label (by default,
                the player name and a “(you)” mark).
          @binding {object} player The player.
        -->
        <slot name="label" v-bind:player="player">
          <span
            v-bind:class="{
              'is-offline': !player.online
            }"
            >{{ player.pseudonym }}</span
          >
          <span class="is-size-7 ourself-mark" v-if="player.ourself">(vous)</span>
        </slot>
      </div>

      <!--
        @slot For each player, this slot contains additional control button, or
              any other content displayed to the right of the player's line.
              You can use `morel-player-action` to add buttons easily.
              You can disable default controls (kick, master) with the
              `default-icons` prop (set it to `false`).
        @binding {object} player The player associated with this control button.
      -->
      <slot name="actions" v-bind:player="player" />

      <template v-if="defaultIcons">
        <morel-player-action
          label="Expulser ce joueur"
          icon="user-alt-slash"
          v-if="we_are_master && !player.master && player.online"
          @click="kick_player(player.uuid)" />
        <morel-player-action
          :label="player.master ? 'Maître du jeu' : 'Passer maître du jeu'"
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

export default {
  props: {
    /**
     * If true, will include all default icons (kick and game master).
     */
    "default-icons": {
      type: Boolean,
      default: true
    },

    /**
     * In the kick confirmation dialog, the title of the popup. {name} will be
     * replaced by the kicked player's name. Accepts HTML.
     * If null, will remove the title.
     */
    "kick-confirm-title": {
      type: String,
      default: ""
    },

    /**
     * In the kick confirmation dialog, the main message of the popup. {name}
     * will be replaced by the kicked player's name. Accepts HTML.
     * If null, will remove the message.
     */
    "kick-confirm-message": {
      type: String,
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
      default: ""
    },

    /**
     * In the kick confirmation dialog, the label of the confirmation dialog
     * button to kick the player. {name} will be replaced by the kicked player's
     * name.
     */
    "kick-confirm-button-yes": {
      type: String,
      default: ""
    },

    /**
     * In the kick confirmation dialog, the label of the confirmation dialog
     * button to cancel the kick. {name} will be replaced by the kicked player's
     * name.
     */
    "kick-confirm-button-no": {
      type: String,
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the title of the popup.
     * {name} will be replaced by the new master player's name. Accepts HTML.
     * If null, will remove the title.
     */
    "master-confirm-title": {
      type: String,
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the main message of the popup.
     * {name} will be replaced by the new master player's name. Accepts HTML.
     * If null, will remove the message.
     */
    "master-confirm-message": {
      type: String,
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
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the label of the confirmation
     * dialog button to masterize the player. {name} will be replaced by the new
     * master player's name.
     */
    "master-confirm-button-yes": {
      type: String,
      default: ""
    },

    /**
     * In the switch master confirmation dialog, the label of the confirmation
     * dialog button to cancel the masterization. {name} will be replaced by the
     * kicked player's name.
     */
    "master-confirm-button-no": {
      type: String,
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

      let message = this.replace_name(
        this.masterConfirmMessage,
        "<strong>{name}</strong> pourra gérer la partie et sa configuration. Vous perdrez ces pouvoirs.",
        player.pseudonym
      )

      let help = this.replace_name(
        this.masterConfirmHelp,
        "Le maître de la partie ne peut pas tricher, uniquement gérer la partie. Il ou elle peut également expulser des joueurs et verrouiller la partie.",
        player.pseudonym
      )

      this.$buefy.dialog.confirm({
        title: this.replace_name(
          this.masterConfirmTitle,
          "Donner le pouvoir à {name} ?",
          player.pseudonym
        ),
        message: `${message}<br /><br /><span class="has-text-grey">${help}</span>`,
        confirmText: this.replace_name(
          this.masterConfirmButtonYes,
          "Donner le pouvoir",
          player.pseudonym
        ),
        cancelText: this.replace_name(
          this.masterConfirmButtonNo,
          "Garder le pouvoir à soi",
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

      let message = this.replace_name(
        this.kickConfirmMessage,
        this.locked
          ? "<strong>{name}</strong> ne pourra pas se reconnecter tant que la partie est verrouillée."
          : "<strong>{name}</strong> quittera la partie, mais pourra toujours se reconnecter, car la partie n'est pas verrouillée.",
        player.pseudonym
      )

      let help = this.replace_name(
        this.kickConfirmHelp,
        this.locked
          ? "Pour déverrouiller la partie, utilisez l'icône cadenas au dessus du bouton de partage de la partie."
          : "Vous pouvez verrouiller la partie grâce à l'icône cadenas au dessus du bouton de partage de la partie.",
        player.pseudonym
      )

      this.$buefy.dialog.confirm({
        title: this.replace_name(
          this.kickConfirmTitle,
          "Expulser {name} ?",
          player.pseudonym
        ),
        message: `${message}<br /><br /><span class="has-text-grey">${help}</span>`,
        confirmText: this.replace_name(
          this.kickConfirmButtonYes,
          "Expulser",
          player.pseudonym
        ),
        cancelText: this.replace_name(
          this.kickConfirmButtonNo,
          "J'ai changé d'avis",
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
