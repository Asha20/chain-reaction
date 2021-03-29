use chain_reaction::{FormChains, PlayRandomly, Player, Runner};
use std::time::Instant;

fn main() -> Result<(), &'static str> {
    let width = 3;
    let height = 3;
    let players: Vec<Box<dyn Player>> =
        vec![Box::new(PlayRandomly {}), Box::new(PlayRandomly {}), Box::new(PlayRandomly {})];

    let now = Instant::now();
    let mut runner = Runner::new(width, height, players, None, None)?;
    let tally = runner.run(100)?;
    println!("Elapsed: {}ms", now.elapsed().as_millis());

    println!("Winner: {:?}", tally);

    Ok(())
}
