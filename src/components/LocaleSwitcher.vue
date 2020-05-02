<template>
  <b-dropdown v-model="current_locale" position="is-top-right" aria-role="list">
    <b-button
      slot="trigger"
      type="is-text"
      size="is-small"
      icon-right="caret-up"
      :loading="locale_loading"
      :disabled="locale_loading">
      {{ locales[current_locale] }}
    </b-button>

    <b-dropdown-item v-for="(locale, i) in Object.keys(locales)" :key="i" :value="locale" aria-role="listitem">
      {{ locales[locale] }}
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('morel', ['locales', 'locale_loading']),
    current_locale: {
      get () {
        return this.$i18n.locale
      },
      set (locale) {
        this.$store.dispatch('morel/set_locale', locale)
      }
    }
  }
}
</script>

<style lang="sass" scoped>
@import "~bulma/sass/utilities/all"

button.button.is-text
  padding-left: 1.2rem
  padding-right: 1.2rem

  font-size: 1em
  text-decoration: none

  > span.gsdgfsdgf
    position: relative
    bottom: .2em

    > span.icon
      position: relative
      top: .42em

      font-size: .86em
</style>
