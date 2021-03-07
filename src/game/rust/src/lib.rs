use wasm_bindgen::prelude::*;

mod array2d;
mod chain_reaction;
mod players;
mod runner;

pub use array2d::Pos;
pub use chain_reaction::ChainReaction;
pub use players::*;
pub use runner::{Player, Runner};

#[wasm_bindgen]
pub fn run(width: usize, height: usize, players: usize, times: u32) -> Vec<usize> {
  let players = vec![PlayRandomly::new(width, height); players];
  let mut runner = Runner::new(width, height, players).unwrap();
  let tally = runner.run(times).unwrap();

  tally
}
