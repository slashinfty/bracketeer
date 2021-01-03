# Bracketeer for Admins

As a server administrator, you can create, start, and end tournaments. Here are the commands and options available.

**Note:** Tournaments operate in a single channel. You can only have one tournament per channel.

---

`!new [options]`

Creates a new tournament in the channel where the message was sent. Options should be in the format `option=value`.

Available options, including their default values, are in the table below. Some options only apply to specific formats.

Option | Valid Values | Default | Formats
------ | ------- | ------------ | -------
name | A string value | The channel name | any
numberOfRounds | Integer greater than 0 | Determined by number of players | swiss
seededPlayers | True/False | False | any
seedOrder | asc, des | asc (ascending) | any
format | elim, 2xelim, robin, 2xrobin, swiss | elim (single elimination) | any
playoffs | elim, 2xelim | null | robin, 2xrobin, swiss
thirdPlaceMatch | True/False | False | elim
bestOf | Non-negative odd integer | 1 | swiss
maxPlayers | Integer greater than 3 | null (no maximum) | any
groupNumber | Integer great than 1 | null (no groups) | robin, 2xrobin
cutType | rank, score | rank | robin, 2xrobin, swiss
cutLimit | Non-negative integer | 0 | robin, 2xrobin, swiss
winValue | Integer greater than 0 | 1 | any
drawValue | Non-negative number | 0.5 | any
lossValue | Integer | 0 | any
tiebreakers | (see below) | (see below) | robin, 2xrobin, swiss

Tiebreakers should be a comma-separated list in order of priority. Possible values include buchholz-cut1, solkoff, median-buchholz, sonneborn-berger, baumbach, cumulative, versus, magic-tcg, pokemon-tcg.

Example: if you wanted Solkoff and cumulative, you'd have `tiebreakers=solkoff,cumulative`.

The defaults for Swiss are Solkoff and cumulative. The defaults for round-robin are Sonneborn-Berger and versus.

---

`!options {option=value}` or `!O {option=value}`

Edits any existing options. See above for all available options.

---

`!start`

Starts the tournament.

---

`!end`

Ends the tournament. This automatically happens 24 hours after the tournament is over.

---

`!export`

Generates a .json file of the tournament.

---

`!upload {type}` or `!U {type}`

Upload a .json file to the bot. Possible types include `tournament` and `seeds`.

If `seededPlayers=true`, then when you attempt to `!start` the tournament, the bot will provide you with a .json file to add the player's seeds. This could be a chess rating or ranking based on a leaderboard.

---

The guide for users is available [here](Users.md).
