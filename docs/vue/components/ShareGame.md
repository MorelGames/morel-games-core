# ShareGame

`<morel-share-game />` A share box with an invite and a “copy link” button. Also includes the lock game button.

## Props

<!-- @vuese:ShareGame:props:start -->
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|type|The button & tooltip types. Any Bulma color can be used here.|`String`|`false`|is-light|

<!-- @vuese:ShareGame:props:end -->


## Slots

<!-- @vuese:ShareGame:slots:start -->
|Name|Description|Default Slot Content|
|---|---|---|
|title|Contains the title of the share section.|`<h3>Share game</h3>` (localized)|
|lock|Contains the lock button.|A default lock button with right events and tooltips attached.|
|invite|The invite text, displayed at the bottom of the share component.|A standard invite, localized.|

<!-- @vuese:ShareGame:slots:end -->


