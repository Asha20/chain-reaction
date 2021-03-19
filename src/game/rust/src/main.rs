use chain_reaction::{PlayRandomly, Runner};
use std::time::Instant;

fn main() -> Result<(), &'static str> {
  let width = 100;
  let height = 100;
  let players = vec![PlayRandomly::new(width, height); 2];

  let now = Instant::now();
  let mut runner = Runner::new(width, height, players, None, None)?;
  let tally = runner.run(100)?;
  println!("Elapsed: {}ms", now.elapsed().as_millis());

  println!("Winner: {:?}", tally);

  Ok(())
}
