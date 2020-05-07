# AskPseudonym

`<morel-ask-pseudonym />` A component that displays the pseudonym field, typically used as the first screen of the game. It also displays error messages if the player is kicked, of if it tries to join a locked game.

## Props

<!-- @vuese:AskPseudonym:props:start -->
|Name|Description|Type|Required|Default|
|---|---|---|---|---|
|label|The field's label.|`String`|`false`|What's your name?|
|label-button|The button's aria-label, for accessibility.|`String`|`false`|Join the game|
|placeholder|The placeholder displayed in the field.|`String`|`false`|Enter your name…|
|type|The component's style type. Can be any Bulma style.|`String`|`false`|is-primary|
|size|The component size.|`String`|`false`|is-large|
|position|The component's position (including label alignment).|`String`|`false`|is-centered|
|maxlength|The max length of the pseudonym.|`Number`|`false`|32|

<!-- @vuese:AskPseudonym:props:end -->


## Slots

<!-- @vuese:AskPseudonym:slots:start -->
|Name|Description|Default Slot Content|
|---|---|---|
|existing|A slot displayed when the player joins an existing game.|A message to inform the player it is joining an existing game, plus a link to create a new game instead.|
|error|The error message, if any. Binds `reason`, the reason why the error occurs. This reason can be `kicked` (the player was kicked out from the game) or `locked` (the player tried to join a locked game).|A light-red frame with a localized explaination and a button to create a new game.|

<!-- @vuese:AskPseudonym:slots:end -->


