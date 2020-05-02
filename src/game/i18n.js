const Vue = require('vue').default
const VueI18n = require('vue-i18n').default

Vue.use(VueI18n)

exports.MorelI18n = class {
  constructor(locale_loader, available_locales) {
    this.store = null

    this.locale_loader = locale_loader

    this.available_locales = available_locales
    this.loaded_locales = ['en']

    this.morel_built_in_locales = ['fr']

    this.i18n = new VueI18n({
      locale: 'en',
      fallbackLocale: 'en',
      formatFallbackMessages: true,
      silentFallbackWarn: true, // Same as below, no keys for English, fallback is normal.
      messages: {} // English is not needed as keys are the English translation.
    })
  }

  set_store(store) {
    this.store = store
    this.store.commit('morel/set_locales', this.available_locales)
  }

  _set_already_loaded_locale(locale) {
    this.i18n.locale = locale
    document.querySelector('html').setAttribute('lang', locale)
    localStorage.setItem('morel-locale', locale)
    return locale
  }

  load_locale(locale) {
    if (this.i18n.locale === locale || this.loaded_locales.includes(locale)) {
      return Promise.resolve(this._set_already_loaded_locale(locale))
    }

    // The language is not loaded yet
    let morel_locale_loader_promise = this.morel_built_in_locales.includes(locale)
    ? import(/* webpackChunkName: "locales-morel-core-[request]" */ './../../locales/' + locale + '.json')
    : Promise.resolve({})

    return morel_locale_loader_promise
      .then(morel_messages => {
        this.locale_loader(locale)
          .then(app_messages => {
            this.i18n.setLocaleMessage(locale, { ...morel_messages.default, ...app_messages.default })
            this.loaded_locales.push(locale)
            return this._set_already_loaded_locale(locale)
          }).catch(() => {
            // If the locale cannot be loaded, we try to load the less-specific locale
            // (i.e. if fr-FR fails, we try fr).

            // Nothing left to try: unavailable.
            if (!locale.includes('-')) return

            const locale_parts = locale.split('-')
            locale_parts.pop()

            return this.load_locale(locale_parts.join('-'))
          })
      })
  }

  load_locale_from_browser() {
    let stored_locale = localStorage.getItem('morel-locale')
    if (stored_locale) this.load_locale(stored_locale)
    else this.load_locale(navigator.language)
  }
}
