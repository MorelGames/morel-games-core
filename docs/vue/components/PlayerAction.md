# PlayerAction

`<morel-player-action />` This displays a small icon with a tooltip and an action on click. It is intented to be used inside the `actions` slot of the `Players` component.

## Props

<!-- @vuese:PlayerAction:props:start -->
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|permanent|If `true`, the icon will be displayed permanently. Else, only on hover.|`Boolean`|`false`|`false`|
|label|The icon's label, displayed in a tooltip.|`String`|`true`|-|
|type|The tooltip's type (all declared Bulma colors can be used here).|`String`|`false`|`is-light`|
|icon|The button's icon.|`String`|`true`|-|
|pack|The icon's pack (defaults to FontAwesome Solid).|`String`|`false`|`fas`|

<!-- @vuese:PlayerAction:props:end -->


