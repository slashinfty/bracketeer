# Bracketeer for Admins

As a server administrator, you can create, start, and end tournaments. Here are the commands and options available.

**Note:** Tournaments run out of a single channel. You can only have one tournament per channel.

---

`!new [options]`

Creates a new tournament in the channel where the message was sent. Options should be in the format `option=value`.

Available options, including their default values, are in the table below. Some options only apply to specific formats.

Option | Valid Values | Default
------ | ------- | ------------
name | A string value | The channel name
numberOfRounds | An integer greater than 0 | Determined by number of players
seededPlayers | True/false | False
seedOrder | asc, des | asc (ascending)
format | elim, 2xelim, robin, 2xrobin, swiss | elim (single elimination)
playoffs | elim, 2xelim | null
thirdPlaceMatch | True/false | False
bestOf | Non-negative odd integer | 1
maxPlayers | Integer greater than 3 | null (determined by number of players)
groupNumber | Integer great than 1 | null (no groups)
cutType | rank, score | rank
cutLimit | Non-negative integer | 0
winValue | Integer greater than 0 | 1
drawValue | Non-negative number | 0.5
lossValue | Integer | 0
tiebreakers | See below | See below

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

---

The guide for users is available [here](Users.md).
