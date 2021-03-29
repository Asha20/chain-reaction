use crate::{runner::GameContext, Player, Pos};

#[derive(Clone)]
pub struct AvoidOthers {}

impl Player for AvoidOthers {
    fn play(&mut self, ctx: GameContext) -> Result<Pos, &'static str> {
        let choice = ctx.available_cells();
        let mut choice: Vec<_> = choice
            .iter()
            .map(|pos| {
                let neighbor_mass_sum = ctx
                    .neighbors(pos)
                    .iter()
                    .map(|(n, _)| ctx.mass(&n))
                    .fold(0, |acc, x| acc + x);

                (pos, neighbor_mass_sum)
            })
            .collect();

        choice.sort_by(|a, b| a.1.cmp(&b.1));

        return Ok(*choice[0].0);
    }
}
