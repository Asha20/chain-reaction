import { ChainReaction, ChainReactionOptions, XY } from "./chain_reaction";
import { array } from "./util";

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

	/** Gets passed to players so they can decide what their move will be. */
	private gameContext: Readonly<GameContext>;

	private cancelled: boolean;
	private running: boolean;

	constructor(options: RunnerOptions) {
		const { width, height, players } = options;

		this.players = players;
		this.game = new ChainReaction({ width, height, players: players.length });
		this.cancelled = false;
		this.gameContext = Object.freeze({
			width: width,
			height: height,
			grid: this.game.grid,
			canPlace: this.game.canPlace.bind(this.game),
		});

		this.running = false;
	}

	/**
	 * Plays out the game until completion the given number of times.
	 *
	 * @returns An array representing a tally of the players' victories.
	 */
	async run(times: number): Promise<number[]> {
		if (this.running) {
			throw new Error("Already running.");
		}

		this.running = true;
		const tally = array(this.players.length, () => 0);

		while (times--) {
			while (this.game.isActive()) {
				if (this.cancelled) {
					await this.game.reset();
					return tally;
				}

				const player = this.players[this.game.currentPlayer];

				const pos = await player.play(this.gameContext);
				await this.game.place(pos.x, pos.y);
			}

			if (!this.cancelled) {
				const winner = this.game.winner();
				tally[winner] += 1;
			}

			await this.game.reset();
		}

		this.running = false;
		return tally;
	}

	cancel(): void {
		this.cancelled = true;
		this.game.cancel();
	}
}
