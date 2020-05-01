This document explains the base protocol all Morel games use. This protocol is followed by the default `MorelClient`.

Other messages can be added for specific games.

# Client → Server

## Common fields

These are included in every message (except if specified), and will not be repeated afterwards.

```json
{
    "action": "action-name",
    "uuid": "the-user-assigned-uuid-or-null-to-get-one",
    "secret": "the-user-assigned-secret-or-null-to-get-one",
    "slug": "the-game-slug"
}
```

- If the `uuid` field is `null` or undefined, the server will send a `set-uuid` message with an UUID and a secret, to send with every subsequent message.
- If the `secret` field is `null` or undefined or invalid, and the `uuid` field is set, the message will be rejected.

## `join-game`

The client asks to join a game.

```json
{
    "pseudonym": "The requested pseudonym"
}
```

If the `slug` is set, the server will add the player to this game if it exists; creating a new one else (either if the `slug` is `null` or unknown).

Will answer with `set-slug` to set the game slug (if the game exists, it will be the same slug as the one sent), and with one `player-join` for every player in the game (including the client that sent the message).

## `update-config`

The client updates the configuration of the game.

```json
{
    "configuration": {}
}
```

The configuration object can be anything (but the server will probably check it).

If the client is not master, or if the game's state is not `CONFIG`, the update will be ignored and a `config-updated` message will be replied with the previous configuration to reset it.

Else, a `config-updated` message will be broadcasted to the players of the game (excluding the client that sent the message), and the new configuration saved server-side.

## `lock-game`

Asks the server to (un)lock the game, preventing any new player to join. If the sender is not master, the message is ignored.

```json
{
  "locked": true
}
```

## `switch-master`

Asks the server to give master power to a specific player. If the sender is not master, the message is ignored.

```json
{
  "master": {
    "uuid": "the new master's UUID"
  }
}
```

## `kick-player`

Asks the server to kick a specific player. If the sender is not master, the message is ignored.

```json
{
  "kick": {
    "uuid": "the kicked player's UUID"
  }
}
```

# Server → Client

## Common fields

These are included in every message, and will not be repeated afterwards.

```json
{
    "action": "action-name"
}
```

## `set-server-runtime-identifier`

Sets an identifier that the client must save (only in the tab session memory; it should not persist over reloads). When the client is disconnected, when it reconnects, it should check the identifier sent and compare it with the one stored, and force-reload if they differ—this means the game server rebooted and the current game is lost.

It is also used when the player was idle in the tab out of a game for way too long, disconnected, and its server-side client reference was cleaned up.

```json
{
  "runtime_identifier": "a string identifier"
}
```

## `set-uuid`

Sets the client's UUID, and a secret for simple auth, to be sent in every subsequent message.

```json
{
    "uuid": "the-user-assigned-uuid",
    "secret": "a-secret-to-authenticate-users"
}
```

## `set-slug`

Sets the game's slug, to be sent in every subsequent message, and to be reflected into the URL / share box.

```json
{
    "slug": "the-game-slug"
}
```

## `kick`

Indicates that the player was kicked from the game. If `locked` is true, that's because the player was unable to join at all due to the game being locked.

```json
{
    "locked": true
}
```

## `player-join`

Indicates that a player joined the game. Also used when a player joins the game to send it all other already-connected players.

```json
{
    "player": {
        "uuid": "8b42a578-5948-4237-8db0-cae73ff16699",
        "pseudonym": "The Pseudonym",
        "ready": true,
        "master": false
    }
}
```

## `player-left`

Indicates that a player left the game.

```json
{
    "player": {
        "uuid": "8b42a578-5948-4237-8db0-cae73ff16699"
    }
}
```

## `set-master`

Indicates that the master player has changed.

```json
{
  "master": {
    "uuid":"8b42a578-5948-4237-8db0-cae73ff16699"
  }
}
```

## `config-updated`

Indicates that the game's config has changed.

```json
{
    "configuration": {
        "categories": [
            "Category 1",
            "Category 2"
        ],
        "stopOnFirstCompletion": false,
        "turns": 4,
        "time": 180
    }
}
```

## `game-locked`

Indicates that the game's locked (or not).

```json
{
  "locked": true
}
```

## `player-ready`

Indicates that a player is ready.

```json
{
    "player": {
        "uuid": "the-user-assigned-uuid",
        "ready": true
    }
}
```

`ready` can be `true` or `false`. If not provided, it defaults to `true`.
