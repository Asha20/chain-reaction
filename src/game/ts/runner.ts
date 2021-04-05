import {
	CellType,
	ChainReaction,
	ChainReactionOptions,
} from "./chain_reaction";
import { array, CancelPromise } from "@common/util";
import { Hooks, extendHooks } from "@common/hooks";
import { neighbors, XY } from "./common";

export interface GameContext {
	width: ChainReaction["width"];
	height: ChainReaction["height"];
	grid: ChainReaction["grid"];

	player: number;
	emptyCells: Set<number>;
	ownedCells: Set<number>[];
	availableCells(): Set<number>;

	canPlace: ChainReaction["canPlace"];
	neighbors(pos: number): number[];
	mass(pos: number): number;
	capacity(pos: number): number;
}

export interface Playable {
	play(context: GameContext): XY | Promise<XY>;
}

interface RunnerOptions extends Omit<ChainReactionOptions, "players"> {
	players: Playable[];
}

function createGameContext(player: number, game: ChainReaction): GameContext {
	const { width, height, emptyCells, ownedCells, grid } = game;

	return Object.freeze({
		width,
		height,
		grid,
		player,
		emptyCells,
		ownedCells,
		availableCells() {
			return new Set([...game.emptyCells, ...game.ownedCells[player]]);
		},

		canPlace: game.canPlace.bind(game),
		capacity: game.capacity.bind(game),

		neighbors(pos) {
			return neighbors(pos, width, height);
		},

		mass(pos) {
			const cell = grid[pos];
			return cell.type === CellType.Owned ? cell.count : 0;
		},
	});
}

export class Runner {
	readonly game: ChainReaction;
	private players: Playable[];

	/** Gets passed to players so they can decide what their move will be. */
	private gameContext: Readonly<GameContext>[];

	private cancelPromise = CancelPromise();
	private tallyPromise = CancelPromise<number[]>();
	hooks: Hooks<"update" | "turnDelay" | "explosionDelay" | "gameDelay">;

	constructor(options: RunnerOptions) {
		const { width, height, players } = options;

		this.players = players;
		this.game = new ChainReaction({ width, height, players: players.length });
		this.gameContext = array(players.length, player =>
			createGameContext(player, this.game),
		);

		this.hooks = extendHooks(this.game.hooks, "turnDelay", "gameDelay");
	}

	/**
	 * Plays out the game until completion the given number of times.
	 *
	 * @returns An array representing a tally of the players' victories.
	 */
	private async _run(
		times: number,
		onGameFinished: (winner: number, id: number, tally: number[]) => void,
	): Promise<number[]> {
		const tally = array(this.players.length, () => 0);

		for (let i = 1; i <= times; i++) {
			while (this.game.isActive()) {
				if (this.cancelPromise.cancelled) {
					await this.game.reset();
					return tally;
				}

				const player = this.players[this.game.currentPlayer];

				const gameContext = this.gameContext[this.game.currentPlayer];

				const availableCells = new Set([
					...gameContext.ownedCells[this.game.currentPlayer],
					...gameContext.emptyCells,
				]);

				if (
					this.game.playerIsAlive(this.game.currentPlayer) &&
					availableCells.size
				) {
					const pos = await Promise.race([
						player.play(gameContext),
						this.cancelPromise.promise as Promise<void>,
					]);

					if (pos) {
						await this.game.place(pos.x, pos.y);
						await this.hooks.run("turnDelay", this.cancelPromise.promise);
					}
				} else {
					// Skip the player's turn if they can't make any legal moves.
					this.game.nextPlayer();
				}
			}

			if (!this.cancelPromise.cancelled) {
				const winner = this.game.winner();
				tally[winner] += 1;
				onGameFinished(winner, i, tally);
			}

			await this.hooks.run("gameDelay", this.cancelPromise.promise);
			await this.game.reset();
		}

		return tally;
	}

	run(
		times: number,
		onGameFinished: (winner: number, id: number, tally: number[]) => void,
	): CancelPromise<number[]> {
		this.cancelPromise = CancelPromise();
		this.tallyPromise = CancelPromise(this._run(times, onGameFinished));

		const oldCancel = this.tallyPromise.cancel.bind(this.tallyPromise);
		this.tallyPromise.cancel = () => {
			oldCancel();
			this.cancelPromise.cancel();
		};

		void this.tallyPromise.promise.then(() => {
			this.game.cancel();
			this.hooks.clear();
		});

		return this.tallyPromise;
	}
}
