# Players

`<morel-players />` This components displays the players list, plus actions on them if the player is master. You can add your own action in a slot.

## Props

<!-- @vuese:Players:props:start -->
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|default-icons|If true, will include all default icons (kick and game master).|`Boolean`|`false`|true|
|kick-confirm-title|In the kick confirmation dialog, the title of the popup. {name} will be replaced by the kicked player's name. Accepts HTML. If null, will remove the title.|`String`|`false`|A standard and localized text.|
|kick-confirm-message|In the kick confirmation dialog, the main message of the popup. {name} will be replaced by the kicked player's name. Accepts HTML. If null, will remove the message.|`String`|`false`|A standard and localized text.|
|kick-confirm-help|In the kick confirmation dialog, another message displayed in gray under the main message. {name} will be replaced by the kicked player's name. Accepts HTML. If null, will remove the help.|`String`|`false`|A standard and localized text.|
|kick-confirm-button-yes|In the kick confirmation dialog, the label of the confirmation dialog button to kick the player. {name} will be replaced by the kicked player's name.|`String`|`false`|A standard and localized text.|
|kick-confirm-button-no|In the kick confirmation dialog, the label of the confirmation dialog button to cancel the kick. {name} will be replaced by the kicked player's name.|`String`|`false`|A standard and localized text.|
|master-confirm-title|In the switch master confirmation dialog, the title of the popup. {name} will be replaced by the new master player's name. Accepts HTML. If null, will remove the title.|`String`|`false`|A standard and localized text.|
|master-confirm-message|In the switch master confirmation dialog, the main message of the popup. {name} will be replaced by the new master player's name. Accepts HTML. If null, will remove the message.|`String`|`false`|A standard and localized text.|
|master-confirm-help|In the switch master confirmation dialog, another message displayed in gray under the main message. {name} will be replaced by the new master player's name. Accepts HTML. If null, will remove the help.|`String`|`false`|A standard and localized text.|
|master-confirm-button-yes|In the switch master confirmation dialog, the label of the confirmation dialog button to masterize the player. {name} will be replaced by the new master player's name.|`String`|`false`|A standard and localized text.|
|master-confirm-button-no|In the switch master confirmation dialog, the label of the confirmation dialog button to cancel the masterization. {name} will be replaced by the kicked player's name.|`String`|`false`|A standard and localized text.|

<!-- @vuese:Players:props:end -->


## Slots

<!-- @vuese:Players:slots:start -->
|Name|Description|Default Slot Content|
|---|---|---|
|icon|For each player, this slot contains the left icon. Binds `player`, the player associated with this icon.|An icon representing the player's readyness, if online; an offline icon, else.|
|label|For each player, this slot contains the main label. Binds `player`, the player currently displayed.|Te player name and a “(you)” mark for the current player, localized.|
|actions|For each player, this slot contains additional control button, or any other content displayed to the right of the player's line. You can use `morel-player-action` to add buttons easily. You can disable default controls (kick, master) with the `default-icons` prop (set it to `false`). Binds `player`, the player associated with this control button.|-|

<!-- @vuese:Players:slots:end -->


