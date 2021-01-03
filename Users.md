# Bracketeer for Users

As a user in a server, you can join a tournament. Here are the commands available to you.

**Note:** Tournaments operate in a single channel. Commands sent in other channels will not be read by the bot.

---

`!join` or `!J`

Join the tournament.

---

`!pairings [all]` or `!P [all]`

Get your current match. If you add `all` after the command, you will get a .json file with all pairings.

---

`!report` or `!results` or `!R`

Report the results of your match. Include the result of the match, with your number of wins first.

Examples: if you played a single game and won, you could enter `!report 1-0`. If you lost in a best of 3 match, you could enter `!results 1-2`. If you drew with your opponent, you could enter `!R 0-0-1`.

---

`!standings [all]` or `!S [all]`

Get a .json file of the current standings. If you add `all` after the command, it will include all players, and not just active players.

---

`!quit` or `!Q`

Quit the tournament. If this is after the tournament has started, you will be dropped (which may result in other players receiving byes in future rounds).

---

The guide for administrators is available [here](Admins.md).
