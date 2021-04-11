# Chain Reaction

[Open the web app](https://asha20.github.io/chain-reaction)

In Chain Reaction, players take turns placing cells on a grid. A player can place a cell on an empty field. They can also place it on a field that already contains their own cells, increasing that cell's mass. Once a cell has reached critical mass (at least as much as the number of neighboring fields around it), it splits into the neighboring fields, converting the opponents' cells into own cells if any happened to be there. The game is finished once only a single player's cells remain on the board, at which point that player is declared the winner.

The game is easy to follow on a small board. However, it gets hectic fast when playing on a larger one. It often happens that players on the verge of defeat, having only a couple of fields with their own cells, end up winning the game by getting a lucky chain reaction that ends up consuming everyone else on the board.

The volatile nature of the game lead to the question: "Is there an optimal strategy for winning?" This web app serves as a playground to compare strategies.

# Development

Clone the repository:

    $ git clone https://github.com/Asha20/chain-reaction.git
    $ cd chain-reaction

Install the dependencies:

    $ npm install

Starting up `webpack-dev-server` for development:

    $ npm run watch

Building for production:

    $ npm run build

Running Prettier on input files:

    $ npm run prettier

Linting source files:

    $ npm run lint

The `prettier` and `lint` scripts run automatically as `pre-commit` Git hooks.