<template>
  <div class="ask-pseudonym">
    <b-field :custom-class="size" :position="position">
      <template slot="label">{{ $t(label) }}</template>
      <b-field :type="unfilled_error ? 'is-danger' : type">
        <b-input
          :placeholder="$t(placeholder)"
          :size="size + ' is-expanded'"
          :maxlength="maxlength"
          v-model.trim="pseudonym"
          @keyup.native.enter="start_game"
          autofocus
        ></b-input>
        <p class="control">
          <button
            class="button"
            :class="[size, type]"
            :aria-label="$t(labelButton)"
            @click="start_game"
          >
            <b-icon icon="chevron-right"></b-icon>
          </button>
        </p> </b-field
    ></b-field>
    <p class="joining-existing-game" v-if="is_existing_game && !kick_reason">
      {{ $t("You're joining an existing game.")}}<br />
      <i18n path="If you wish, you can also {create_new_game}.">
        <a href="#" @click.prevent="erase_slug" slot="create_new_game">{{ $t("create a new game") }}</a>
      </i18n>
    </p>
    <b-message v-if="kick_reason" type="is-danger" class="kick-reason">
      <p>
        <template v-if="kick_reason === 'locked'">
          {{ $t("You cannot join this game because it's locked.") }}
        </template>
        <template v-else>
          {{ $t("You got kicked out of the game.") }}
        </template>
      </p>
      <p>
        <b-button type="is-danger" @click="create_new_game">{{ $t("Create a new game") }}</b-button>
      </p>
    </b-message>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  props: {
    /**
     * The field's label.
     */
    label: {
      type: String,
      default: "What's your name?"
    },

    /**
     * The button's aria-label, for accessibility.
     */
    "label-button": {
      type: String,
      default: "Join the game"
    },

    /**
     * The placeholder displayed in the field.
     */
    placeholder: {
      type: String,
      default: "Enter your name…"
    },

    /**
     * The component's style type. Can be any Bulma style.
     */
    type: {
      type: String,
      default: 'is-primary'
    },

    /**
     * The component size.
     * @values is-small, is-medium, is-large, <empty>.
     */
    size: {
      type: String,
      default: "is-large"
    },

    /**
     * The component's position (including label alignment).
     * @values is-left, is-centered, is-right.
     */
    position: {
      type: String,
      default: "is-centered"
    },

    /**
     * The max length of the pseudonym.
     */
    maxlength: {
      type: Number,
      default: 32
    }
  },

  data() {
    return {
      pseudonym: "",
      unfilled_error: false,
      starting: false
    };
  },

  computed: {
    ...mapState('morel', {
      is_existing_game: state => !!state.slug,
      kick_reason: state => state.kick_reason
    })
  },

  mounted: function() {
    this.pseudonym = localStorage.getItem("morel-pseudonym") || ""
  },

  methods: {
    start_game() {
      if (this.pseudonym) {
        this.starting = true
        setTimeout(() => this.starting = false, 1000)

        localStorage.setItem("morel-pseudonym", this.pseudonym)
        this.$store.dispatch("morel/set_pseudonym_and_connect", this.pseudonym)
      }
      else {
        this.unfilled_error = true
        setTimeout(() => this.unfilled_error = false, 2500)
      }
    },
    erase_slug() {
      this.$store.dispatch("morel/set_slug", "")
      this.$store.commit("morel/set_kick_reason", null)
    },
    create_new_game() {
      this.erase_slug()
      this.start_game()
    }
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/mixins"

.ask-pseudonym
  .field
    &.has-addons-centered
      text-align: center
    &.has-addons-right
      text-align: right
  +mobile
    padding: 0 1rem

div.field div.field
  margin-top: 2em !important

p.joining-existing-game
  text-align: center

.kick-reason
  margin: auto
  width: 100%

  +mobile
    width: 100%

  .message-body
    border: none

    .media-content p
      text-align: center

      & + p
        margin-top: 1rem
</style>
