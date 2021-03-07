use crate::array2d::Pos;
use crate::chain_reaction::ChainReaction;

pub trait Player {
  fn play(&mut self, game: &ChainReaction) -> Result<Pos, &'static str>;
}

pub struct Runner<F: Player> {
  width: usize,
  height: usize,
  game: ChainReaction,
  players: Vec<F>,
}

impl<F: Player> Runner<F> {
  pub fn new(width: usize, height: usize, players: Vec<F>) -> Result<Runner<F>, &'static str> {
    let game = ChainReaction::new(width, height, players.len())?;

    Ok(Runner {
      width,
      height,
      game,
      players,
    })
  }

  pub fn run(&mut self, times: u32) -> Result<Vec<usize>, &'static str> {
    let mut tally = vec![0; self.players.len()];
    for _ in 0..times {
      while self.game.active() {
        let player = self.game.current_player();
        let player_move = self.players[player].play(&self.game)?;
        self.game.place(&player_move)?;
      }

      let winner = self.game.winner()?;
      *tally.get_mut(winner).unwrap() += 1;
      self.game = ChainReaction::new(self.width, self.height, self.players.len())?;
    }
    Ok(tally)
  }
}
