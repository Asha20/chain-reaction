use crate::array2d::Pos;
use crate::chain_reaction::ChainReaction;
use std::convert::TryInto;

pub trait Player {
  fn play(&mut self, game: &ChainReaction) -> Result<Pos, &'static str>;
}

pub struct Runner<'a, P>
where
  P: Player,
{
  width: usize,
  height: usize,
  game: ChainReaction,
  players: Vec<P>,

  on_game_finished: Option<Box<dyn Fn(&Vec<usize>, &usize, &u32) + 'a>>,
  should_stop: Option<Box<dyn Fn() -> bool + 'a>>,
}

impl<'a, P> Runner<'a, P>
where
  P: Player,
{
  pub fn new(
    width: usize,
    height: usize,
    players: Vec<P>,
    on_game_finished: Option<Box<dyn Fn(&Vec<usize>, &usize, &u32) + 'a>>,
    should_stop: Option<Box<dyn Fn() -> bool + 'a>>,
  ) -> Result<Runner<'a, P>, &'static str> {
    let game = ChainReaction::new(width, height, players.len())?;

    Ok(Runner {
      width,
      height,
      game,
      players,
      on_game_finished,
      should_stop,
    })
  }

  pub fn run_js(
    &mut self,
    times: u32,
    id_array: &js_sys::Uint32Array,
    tally_array: &js_sys::Uint32Array,
  ) -> Result<Vec<usize>, &'static str> {
    let mut tally = vec![0; self.players.len()];
    for id in 1..times + 1 {
      while self.game.active() {
        let player = self.game.current_player();
        let player_move = self.players[player].play(&self.game)?;
        self.game.place(&player_move)?;
      }

      let winner = self.game.winner()?;
      *tally.get_mut(winner).unwrap() += 1;
      let winner_u32: u32 = winner.try_into().unwrap();
      tally_array.set_index(winner_u32, tally_array.get_index(winner_u32) + 1);
      id_array.set_index(0, id);

      if id_array.get_index(1) != 0 {
        return Ok(tally);
      }

      self.game = ChainReaction::new(self.width, self.height, self.players.len())?;
    }
    Ok(tally)
  }

  pub fn run(&mut self, times: u32) -> Result<Vec<usize>, &'static str> {
    let mut tally = vec![0; self.players.len()];
    for id in 1..times + 1 {
      while self.game.active() {
        let player = self.game.current_player();
        let player_move = self.players[player].play(&self.game)?;
        self.game.place(&player_move)?;
      }

      let winner = self.game.winner()?;
      *tally.get_mut(winner).unwrap() += 1;

      if let Some(on_game_finished) = &self.on_game_finished {
        on_game_finished(&tally, &winner, &id);
      }

      if let Some(should_stop) = &self.should_stop {
        if should_stop() {
          return Ok(tally);
        }
      }

      self.game = ChainReaction::new(self.width, self.height, self.players.len())?;
    }
    Ok(tally)
  }
}
