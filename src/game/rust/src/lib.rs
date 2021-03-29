use std::convert::TryInto;
use wasm_bindgen::prelude::*;

mod array2d;
mod chain_reaction;
mod players;
mod runner;

pub use array2d::Pos;
pub use chain_reaction::ChainReaction;
pub use players::*;
pub use runner::{Player, Runner};

fn resolve_players(players: &js_sys::Uint32Array) -> Vec<Box<dyn Player>> {
    let mut result: Vec<Box<dyn Player>> = Vec::new();

    for i in 0u32..players.length() {
        let player: Box<dyn Player> = match players.get_index(i) {
            0 => Box::new(PlayRandomly {}),
            _ => panic!("Unrecognized player"),
        };

        result.push(player);
    }

    result
}

#[wasm_bindgen]
pub fn run_with_shared_buffer(
    width: usize,
    height: usize,
    players: &js_sys::Uint32Array,
    times: u32,
    control_buffer: &js_sys::SharedArrayBuffer,
    tally_buffer: &js_sys::SharedArrayBuffer,
) -> Vec<usize> {
    let control_array = js_sys::Uint32Array::new(control_buffer);
    let tally_array = js_sys::Uint32Array::new(tally_buffer);

    let players = resolve_players(players);

    let mut runner = Runner::new(
        width,
        height,
        players,
        Some(Box::new(|_tally, &winner, &game_id| {
            let winner_u32: u32 = winner.try_into().unwrap();
            tally_array.set_index(winner_u32, tally_array.get_index(winner_u32) + 1);
            control_array.set_index(0, game_id);
        })),
        Some(Box::new(|| control_array.get_index(1) != 0)),
    )
    .unwrap();

    let tally = runner.run(times).unwrap();

    tally
}

#[wasm_bindgen]
pub fn run(width: usize, height: usize, players: &js_sys::Uint32Array, times: u32) -> Vec<usize> {
    let players = resolve_players(players);
    let mut runner = Runner::new(width, height, players, None, None).unwrap();

    let tally = runner.run(times).unwrap();

    tally
}
