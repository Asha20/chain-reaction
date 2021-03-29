use chain_reaction::{PlayRandomly, Runner};
use std::time::Instant;

fn main() -> Result<(), &'static str> {
    let width = 50;
    let height = 50;
    let players = vec![PlayRandomly {}; 2];

    let now = Instant::now();
    let mut runner = Runner::new(width, height, players, None, None)?;
    let tally = runner.run(10)?;
    println!("Elapsed: {}ms", now.elapsed().as_millis());

    println!("Winner: {:?}", tally);

    Ok(())
}
