use crate::{runner::GameContext, Player, Pos};
use rand::{thread_rng, Rng};

#[derive(Clone)]
pub struct FormChains {
    current: Option<Pos>,
}

impl FormChains {
    pub fn new() -> Self {
        FormChains { current: None }
    }
}

impl Player for FormChains {
    fn play(&mut self, ctx: GameContext) -> Result<Pos, &'static str> {
        let available = ctx.available_cells();

        let non_critical: Vec<_> = available
            .iter()
            .filter(|p| ctx.mass(p) < ctx.capacity(p) - 1)
            .collect();

        let choice: Vec<_> = match non_critical.len() {
            0 => available.iter().collect(),
            _ => non_critical,
        };

        if self
            .current
            .map_or(true, |current| !available.contains(&current))
        {
            let index = thread_rng().gen_range(0..choice.len());
            self.current = Some(*choice[index]);
        } else if let Some(pos) = self.current {
            if ctx.mass(&pos) == ctx.capacity(&pos) - 1 {
                let neighbors = ctx.neighbors(&pos);
                let neighbors: Vec<_> = neighbors
                    .iter()
                    .filter(|(n, _)| available.contains(n) && ctx.mass(n) < ctx.capacity(n) - 1)
                    .collect();

                self.current = match neighbors.len() {
                    0 => {
                        let index = thread_rng().gen_range(0..choice.len());
                        Some(*choice[index])
                    }
                    _ => {
                        let index = thread_rng().gen_range(0..neighbors.len());
                        Some(neighbors[index].0)
                    }
                };
            }
        };

        Ok(self.current.expect("No current cell selected."))
    }
}
