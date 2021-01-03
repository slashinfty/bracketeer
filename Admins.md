# Bracketeer for Admins

As a server administrator, you can create, start, and end tournaments. Here are the commands and options available.

**Note:** Tournaments run out of a single channel. You can only have one tournament per channel.

`!new [options]`

Creates a new tournament in the channel where the message was sent. Options should be in the format `option=value`.

Available options, including their default values, are in the table below.

Option | Default | Valid Values
------ | ------- | ------------

`!options {option=value}` or `!O {option=value}`

Edits any existing options. See above for all available options.

`!start`

Starts the tournament.

`!end`

Ends the tournament. This automatically happens 24 hours after the tournament is over.

`!export`

Generates a .json file of the tournament.

`!upload {type}` or `!U {type}`

Upload a .json file to the bot. Possible types include `tournament` and `seeds`.
