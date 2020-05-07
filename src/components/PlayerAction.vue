<template>
  <div
    class="panel-icon-right morel-player-action-icon"
    :class="{'is-permanent': permanent}"
    :aria-label="label"
    aria-haspopup="true"
    role="button"
    v-on="$listeners"
  >
    <b-tooltip
      :label="label"
      position="is-bottom"
      :type="type"
    >
      <b-icon :pack="pack" :icon="icon" size="is-small"></b-icon>
    </b-tooltip>
  </div>
</template>

<script>
  /**
   * `<morel-player-action />`
   *
   * This displays a small icon with a tooltip and an action on click. It is
   * intented to be used inside the `actions` slot of the `Players`
   * component.
   */
  export default {
    props: {
      /**
       * If `true`, the icon will be displayed permanently. Else, only on hover.
       */
      permanent: {
        type: Boolean,
        // `false`
        default: false
      },

      /**
       * The icon's label, displayed in a tooltip.
       */
      label: {
        type: String,
        default: '',
        required: true
      },

      /**
       * The tooltip's type (all declared Bulma colors can be used here).
       */
      type: {
        type: String,
        // `is-light`
        default: 'is-light'
      },

      /**
       * The button's icon.
       */
      icon: {
        type: String,
        required: true
      },

      /**
       * The icon's pack (defaults to FontAwesome Solid).
       */
      pack: {
        type: String,
        // `fas`
        default: 'fas'
      }
    }
  }
</script>

<style lang="sass">
@import "~bulma/sass/utilities/_all"

.panel.morel-players-list .panel-block .panel-icon-right.morel-player-action-icon
  display: none
  color: $grey
  cursor: pointer

  &.is-permanent
    display: block
    color: $grey-light
    cursor: normal

  + .morel-player-action-icon
    margin-left: .8em
</style>
