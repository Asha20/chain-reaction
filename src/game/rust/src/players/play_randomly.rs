use crate::{runner::GameContext, Player, Pos};
use rand::{thread_rng, Rng};

#[derive(Clone)]
pub struct PlayRandomly {}

impl Player for PlayRandomly {
    fn play(&mut self, ctx: GameContext) -> Result<Pos, &'static str> {
        let available = ctx.available_cells();
        let available: Vec<_> = available.iter().collect();

        if available.len() == 0 {
            Err("There are no available cells.")
        } else {
            let index = thread_rng().gen_range(0..available.len());
            Ok(*available[index])
        }
    }
}
