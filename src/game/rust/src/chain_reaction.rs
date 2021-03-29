use crate::array2d::{Array2D, Pos};

use std::{
    cell::{Cell, RefCell},
    collections::HashSet,
    convert::TryInto,
    fmt,
    iter::FromIterator,
};

#[derive(Clone, Copy)]
pub struct FieldData {
    pub owner: usize,
    pub count: u32,
}

#[derive(Clone, Copy)]
pub enum Field {
    Owned(FieldData),
    Empty,
}

impl fmt::Display for Field {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Field::Owned(data) => write!(f, "{}", data.count),
            Field::Empty => write!(f, "o"),
        }
    }
}

pub struct ChainReaction {
    width: usize,
    height: usize,
    players: usize,
    current_player: Cell<usize>,
    move_count: Cell<u32>,

    pub empty_cells: RefCell<HashSet<Pos>>,
    pub owned_cells: RefCell<Vec<HashSet<Pos>>>,

    pub grid: Array2D<Cell<Field>>,
    pub capacity: Array2D<u32>,
    player_count: Vec<Cell<u32>>,
}

impl ChainReaction {
    pub fn new(width: usize, height: usize, players: usize) -> Result<ChainReaction, &'static str> {
        if width == 0 {
            Err("Width cannot be zero.")
        } else if height == 0 {
            Err("Height cannot be zero.")
        } else if players == 0 {
            Err("Player count cannot be zero.")
        } else {
            let grid = Array2D::new(Cell::new(Field::Empty), Pos(width, height));
            let capacity = ChainReaction::get_capacity(width, height);

            let empty_cells_iter = (0..width * height).map(|p| Pos(p % width, p / width));

            Ok(ChainReaction {
                width,
                height,
                players,
                grid,
                capacity,
                current_player: Cell::new(0),
                move_count: Cell::new(0),
                player_count: vec![Cell::new(0); players],

                empty_cells: RefCell::new(HashSet::from_iter(empty_cells_iter)),
                owned_cells: RefCell::new(vec![HashSet::new(); players]),
            })
        }
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn current_player(&self) -> usize {
        self.current_player.get()
    }

    fn change_owner(&self, pos: &Pos, prev_owner: Option<usize>, new_owner: Option<usize>) {
        match (prev_owner, new_owner) {
            (None, Some(new)) => {
                self.empty_cells.borrow_mut().remove(pos);
                self.owned_cells
                    .borrow_mut()
                    .get_mut(new)
                    .map(|x| x.insert(*pos));
            }
            (Some(old), None) => {
                self.owned_cells
                    .borrow_mut()
                    .get_mut(old)
                    .map(|x| x.remove(pos));
                self.empty_cells.borrow_mut().insert(*pos);
            }
            (Some(old), Some(new)) => {
                self.owned_cells
                    .borrow_mut()
                    .get_mut(old)
                    .map(|x| x.remove(pos));
                self.owned_cells
                    .borrow_mut()
                    .get_mut(new)
                    .map(|x| x.insert(*pos));
            }
            (None, None) => {}
        };
    }

    pub fn place(&self, pos: &Pos) -> Result<(), &'static str> {
        let player = self.current_player.get();
        if !self.active() {
            return Err("Cannot play after the game is finished.");
        }

        if player >= self.players {
            return Err("Invalid player.");
        }

        let field = self.grid.get(pos)?;

        let new_data = match field.get() {
            Field::Owned(FieldData { owner, count }) => {
                if owner != player {
                    return Err("Field is already taken.");
                } else {
                    self.change_owner(pos, Some(owner), Some(player));

                    FieldData {
                        owner: player,
                        count: count + 1,
                    }
                }
            }
            Field::Empty => {
                self.change_owner(pos, None, Some(player));

                FieldData {
                    owner: player,
                    count: 1,
                }
            }
        };

        let &capacity = self.capacity.get(pos)?;
        self.increase_player_count(player, 1);
        self.move_count.set(self.move_count.get() + 1);

        if new_data.count >= capacity {
            field.set(Field::Empty);
            self.change_owner(pos, Some(player), None);

            self.explode(pos, player)?;
        } else {
            field.set(Field::Owned(new_data));
        }

        self.current_player.set((player + 1) % self.players);

        Ok(())
    }

    pub fn can_play(&self, pos: &Pos) -> Result<bool, &'static str> {
        let field = self.grid.get(pos)?.get();

        let result = match field {
            Field::Empty => true,
            Field::Owned(FieldData { owner, .. }) => owner == self.current_player.get(),
        };

        Ok(result)
    }

    fn get_capacity(width: usize, height: usize) -> Array2D<u32> {
        let mut grid = Array2D::new(4, Pos(width, height));

        for y in 0..height {
            if let Ok(f) = grid.get_mut(&Pos(0, y)) {
                *f -= 1;
            }

            if let Ok(f) = grid.get_mut(&Pos(width - 1, y)) {
                *f -= 1;
            }
        }

        for x in 0..width {
            if let Ok(f) = grid.get_mut(&Pos(x, 0)) {
                *f -= 1;
            }

            if let Ok(f) = grid.get_mut(&Pos(x, height - 1)) {
                *f -= 1;
            }
        }

        grid
    }

    pub fn neighbors(&self, pos: &Pos) -> Vec<(Pos, &Cell<Field>)> {
        let Pos(x, y) = *pos;

        let offsets = (0..4).map(|i| match i {
            0 => x.checked_sub(1).map(|x| Pos(x, y)),
            1 => Some(Pos(x + 1, y)),
            2 => y.checked_sub(1).map(|y| Pos(x, y)),
            3 => Some(Pos(x, y + 1)),
            _ => unreachable!(),
        });

        let positions: Vec<_> = offsets.flatten().filter(|x| self.in_bounds(x)).collect();

        let cells: Vec<_> = positions
            .iter()
            .map(|pos| self.grid.get(pos))
            .flatten()
            .collect();

        positions.iter().cloned().zip(cells).collect()
    }

    fn in_bounds(&self, &Pos(x, y): &Pos) -> bool {
        x < self.width && y < self.height
    }

    fn increase_player_count(&self, player: usize, delta: u32) {
        self.player_count[player].set(self.player_count[player].get() + delta);
    }

    fn decrease_player_count(&self, player: usize, delta: u32) {
        self.player_count[player].set(self.player_count[player].get() - delta);
    }

    pub fn active(&self) -> bool {
        let alive_players_count: u32 = self
            .player_count
            .iter()
            .filter(|x| x.get() > 0)
            .count()
            .try_into()
            .unwrap();

        if self.move_count.get() <= alive_players_count {
            true
        } else {
            assert!(alive_players_count > 0);
            alive_players_count > 1
        }
    }

    pub fn winner(&self) -> Result<usize, &'static str> {
        if self.active() {
            Err("Game is still in progress.")
        } else {
            self.player_count
                .iter()
                .position(|x| x.get() > 0)
                .ok_or("There is no winner.")
        }
    }

    fn explode(&self, origin: &Pos, player: usize) -> Result<(), &'static str> {
        let mut queue = self.neighbors(origin);

        let mut increase_count = 0;

        while queue.len() > 0 {
            let mut new_queue: Vec<(Pos, &Cell<Field>)> = Vec::new();

            for (pos, field) in &queue {
                let new_data = match field.get() {
                    Field::Owned(data) => {
                        if data.owner != player {
                            self.change_owner(pos, Some(data.owner), Some(player));
                            increase_count += data.count;
                            self.decrease_player_count(data.owner, data.count);
                        }

                        FieldData {
                            owner: player,
                            count: data.count + 1,
                        }
                    }
                    Field::Empty => {
                        self.change_owner(pos, None, Some(player));

                        FieldData {
                            owner: player,
                            count: 1,
                        }
                    }
                };
                let &capacity = self.capacity.get(pos)?;
                if new_data.count >= capacity {
                    field.set(Field::Empty);
                    self.change_owner(pos, Some(player), None);

                    for (neighbor_pos, neighbor) in self.neighbors(pos) {
                        new_queue.push((neighbor_pos, neighbor));
                    }
                } else {
                    field.set(Field::Owned(new_data));
                }
            }

            if self.active() {
                queue = new_queue;
            } else {
                queue = vec![];
            }
        }

        self.increase_player_count(player, increase_count);

        Ok(())
    }
}

impl fmt::Display for ChainReaction {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        self.grid.fmt(f)?;
        write!(f, "\n")?;
        let values: Vec<_> = self.player_count.iter().map(|x| x.get()).collect();
        write!(f, "{:?}", values)?;
        Ok(())
    }
}
