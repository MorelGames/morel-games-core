const Vue = require('vue').default
const VueI18n = require('vue-i18n').default

Vue.use(VueI18n)

/**
 * Integrates Vue-I18n and Morel games. provides useful methods to load and
 * switch locales.
 */
const MorelI18n = class {
  /**
   * Constructs the bridge between the game and Vue-I18n.
   *
   * For the locale loader, it is recommanded to load the locale using `import`
   * with a webpack chunk comment, so locales are lazy-loaded instead of bundled
   * in one huge JS file. Example (the end of the webpack comment is altered
   * else the JSDoc comment will break):
   *
   * ```js
   * locale => import(/* webpackChunkName: "locales-[request]" *\/ "./../locales/" + locale + ".json")
   * ```
   *
   * @param {function} locale_loader A function with the locale as argument,
   *                                 returning a Promise of the catalog for this
   *                                 for this locale.
   * @param {object} available_locales An object with all available locales for
   *                                   this application. The key is the locale
   *                                   code (e.g. `fr`) and the value, the
   *                                   locale name in the locale language (e.g.
   *                                   `Français`).
   */
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

  /**
   * Sets the Vuex store. Must be set before any usage of the class.
   *
   * @param {Vuex.Store} store The store.
   */
  set_store(store) {
    this.store = store
    this.store.commit('morel/set_locales', this.available_locales)
  }

  /**
   * Changes the locale. The locale must be loaded already.
   *
   * This will also save the current locale in the `localStorage`.
   *
   * @param {string} locale The locale.
   * @return {string} The locale.
   */
  _set_already_loaded_locale(locale) {
    this.i18n.locale = locale
    document.querySelector('html').setAttribute('lang', locale)
    localStorage.setItem('morel-locale', locale)
    return locale
  }

  /**
   * Loads a locale, then switch to this locale.
   *
   * If a locale with a geographic code is given (i.e. `fr_FR`) and not found,
   * the base locale (`fr`) will be tried.
   *
   * @param {string} locale The locale.
   * @return {Promise} A promise resolved when the locale is fully loaded.
   */
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

  /**
   * Inspects the user browser to determine the best locale.
   *
   * If there is a locale previously saved in the `localStorage`, we use that.
   * Else, we look at the browser's exposed language and use the closest locale
   * available, fallbacking to English.
   */
  load_locale_from_browser() {
    let stored_locale = localStorage.getItem('morel-locale')
    if (stored_locale) this.load_locale(stored_locale)
    else this.load_locale(navigator.language)
  }
}

exports.MorelI18n = MorelI18n
