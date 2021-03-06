import { ChainReaction, ChainReactionOptions, XY } from "./chain_reaction";

export interface GameContext {
	width: ChainReaction["width"];
	height: ChainReaction["height"];
	grid: ChainReaction["grid"];

	canPlace: ChainReaction["canPlace"];
}

export interface Player {
	play(context: GameContext): XY | Promise<XY>;
}

interface RunnerOptions extends Omit<ChainReactionOptions, "players"> {
	players: Player[];
}

export class Runner {
	readonly game: ChainReaction;
	private players: Player[];
	private gameContext: GameContext;

	constructor(options: RunnerOptions) {
		const { width, height, players } = options;

		this.players = players;
		this.game = new ChainReaction({ width, height, players: players.length });
		this.gameContext = {
			width: width,
			height: height,
			grid: this.game.grid,
			canPlace: this.game.canPlace.bind(this.game),
		};
	}

	async run(): Promise<number> {
		while (this.game.isActive()) {
			const player = this.players[this.game.currentPlayer];

			const pos = await player.play(this.gameContext);
			await this.game.place(pos.x, pos.y);
		}

		const winner = this.game.winner();
		return winner;
	}
}
