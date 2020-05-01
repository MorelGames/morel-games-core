const components = {
  "share-game": require('./ShareGame.vue').default,
  "players": require('./Players.vue').default,
  "player-action": require('./PlayerAction.vue').default,
  "ask-pseudonym": require('./AskPseudonym.vue').default
}

exports.default = {
  install(Vue, options) {
    Object.keys(components).forEach(component_name => {
      Vue.component(`morel-${component_name}`, components[component_name])
    })
  }
}
