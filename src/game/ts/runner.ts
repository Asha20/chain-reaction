import { ChainReaction, ChainReactionOptions, XY } from "./chain_reaction";
import { array, CancelPromise } from "@common/util";
import { Hooks, extendHooks } from "@common/hooks";

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

	private _running = false;
	private cancelPromise = CancelPromise();
	hooks: Hooks<"update" | "turnDelay" | "explosionDelay">;

	constructor(options: RunnerOptions) {
		const { width, height, players } = options;

		this.players = players;
		this.game = new ChainReaction({ width, height, players: players.length });
		this.gameContext = Object.freeze({
			width: width,
			height: height,
			grid: this.game.grid,
			canPlace: this.game.canPlace.bind(this.game),
		});

		this.hooks = extendHooks(this.game.hooks, "turnDelay");
	}

	get running(): boolean {
		return this._running;
	}

	/**
	 * Plays out the game until completion the given number of times.
	 *
	 * @returns An array representing a tally of the players' victories.
	 */
	async run(
		times: number,
		onGameFinished: (winner: number, id: number, tally: number[]) => void,
	): Promise<number[]> {
		if (this._running) {
			throw new Error("Already running.");
		}

		this._running = true;
		const tally = array(this.players.length, () => 0);

		for (let i = 1; i <= times; i++) {
			while (this.game.isActive()) {
				if (this.cancelPromise.cancelled) {
					await this.game.reset();
					return tally;
				}

				const player = this.players[this.game.currentPlayer];

				const pos = await player.play(this.gameContext);
				await this.game.place(pos.x, pos.y);
				await this.hooks.run("turnDelay", this.cancelPromise.promise);
			}

			if (!this.cancelPromise.cancelled) {
				const winner = this.game.winner();
				tally[winner] += 1;
				onGameFinished(winner, i, tally);
			}

			await this.game.reset();
		}

		this._running = false;
		return tally;
	}

	cancel(): void {
		this.cancelPromise.cancel();
		this.game.cancel();
		this.hooks.clear();
	}
}
