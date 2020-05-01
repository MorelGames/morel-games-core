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
  export default {
    props: {
      /**
       * If `true`, the icon will be displayed permanently. Else, only on hover.
       */
      permanent: {
        type: Boolean,
        default: false
      },

      /**
       * The icon's label, displayed in a tooltip.
       */
      label: {
        type: String,
        default: ''
      },

      /**
       * The tooltip's type (all declared Bulma colors can be used here).
       */
      type: {
        type: String,
        default: 'is-light'
      },

      /**
       * The button's icon.
       */
      icon: {
        type: String
      },

      /**
       * The icon's pack (defaults to FontAwesome Solid).
       */
      pack: {
        type: String,
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
