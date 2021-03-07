use crate::{ChainReaction, Player, Pos};
use rand::distributions::Uniform;
use rand::prelude::*;

#[derive(Clone)]
pub struct PlayRandomly {
  rng: ThreadRng,
  x_between: Uniform<usize>,
  y_between: Uniform<usize>,
}

impl PlayRandomly {
  pub fn new(width: usize, height: usize) -> PlayRandomly {
    PlayRandomly {
      rng: rand::thread_rng(),
      x_between: Uniform::from(0..width),
      y_between: Uniform::from(0..height),
    }
  }
}

impl Player for PlayRandomly {
  fn play(&mut self, game: &ChainReaction) -> Result<Pos, &'static str> {
    loop {
      let x = self.x_between.sample(&mut self.rng);
      let y = self.y_between.sample(&mut self.rng);

      let pos = Pos(x, y);

      if game.can_play(&pos)? {
        return Ok(pos);
      }
    }
  }
}
