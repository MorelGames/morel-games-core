<template>
  <section class="share-game">
    <header>
      <h3>
        <slot name="title">{{ $t("Share game") }}</slot>
      </h3>
      <slot name="lock">
        <b-tooltip :label="lock_tooltip" position="is-bottom" :type="type" :class="{'is-static': !master}">
          <b-button
            :icon-left="locked ? 'lock' : 'lock-open'"
            :loading="lock_loading"
            :disabled="!master"
            @click="toggle_lock"
            type="is-text" />
        </b-tooltip>
      </slot>
    </header>
    <b-field grouped size="is-small">
      <b-input
        :value="share_url"
        size="is-small"
        readonly
        expanded
        id="share-url-field"
        @focus="$event.target.select()"
      >
      </b-input>
      <p class="control copy-button">
        <b-tooltip
          :label="copied ? $t('Copied!') : $t('Copy link to clipboard')"
          position="is-bottom"
          :type="type"
          multilined
        >
          <b-button class="button" :type="type" icon-left="clipboard" @click.stop.prevent="copy_url" :expanded="true">
            {{ $t("Copy game link") }}
          </b-button>
        </b-tooltip>
      </p>
    </b-field>
    <p class="share-invite">
      <slot name="invite">
        {{ $t("Invite other players to open this link in their browser to join this game.") }}
      </slot>
    </p>
  </section>
</template>

<script>
import { mapState } from "vuex";

export default {
  props: {
    /**
     * The button & tooltip types. Any Bulma color can be used here.
     */
    type: {
      type: String,
      default: "is-light"
    }
  },
  data() {
    return {
      copied: false
    };
  },
  computed: {
    ...mapState('morel', {
      share_url: state => `${window.location.origin}/${state.slug}`,
      locked: state => state.locked,
      lock_loading: state => state.lock_loading,
      master: state => state.master
    }),
    lock_tooltip() {
      const $t = this.$t.bind(this)

      if (this.master) {
        return this.locked ? $t("Unlock the game") : $t("Lock the game")
      } else {
        return this.locked ? $t("Game locked") : $t("Game unlocked")
      }
    }
  },
  methods: {
    copy_url() {
      let share_url_field = document.getElementById("share-url-field");
      share_url_field.select();

      try {
        if (document.execCommand("copy")) {
          this.copied = true;
          setTimeout(() => (this.copied = false), 1600);
        }
      } catch (e) {
        console.error("Unable to copy game URL", e);
      }

      share_url_field.blur();
    },

    toggle_lock() {
      if (this.master) {
        this.$store.dispatch("morel/lock_game", !this.locked);
      }
    }
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/_all"

.share-game
  +mobile
    margin: 0 1rem 1.5rem

  header
    display: flex
    align-items: center

    h3
      flex: 4

      position: relative
      left: 1px

      font-weight: bold
      margin: 1rem 0 .4rem

    span.b-tooltip
      button.button
        position: relative
        top: 5px

        font-size: .9em
        color: $grey

        &, &:hover, &:active, &:focus
          background: none
          border: none
          box-shadow: none

        &:hover, &:active, &:focus
          color: $grey-dark

        span.icon
          transform: scale(-1, 1)

      &.is-static button.button
        cursor: default

  .field.is-grouped
    position: relative

    margin-bottom: .4em
    align-items: center

    input
      border-color: $grey-light
      border-radius: 4px

      font-size: 0.9rem

      +mobile
        font-size: 0.95rem

    // This element must remain “displayed”, else copy will not work.
    .control:not(.copy-button)
      position: absolute
      margin-left: -999999px

    .control.copy-button
      &, & .b-tooltip
        width: 100%

  .share-invite
    position: relative
    left: 1px

    font-size: .9em
    color: $grey-dark !important
</style>
