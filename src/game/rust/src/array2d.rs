use std::{cell::Cell, fmt};

pub struct Array2D<T> {
    array: Vec<T>,
    width: usize,
    height: usize,
}

impl<T: fmt::Display + Copy> fmt::Display for Array2D<Cell<T>> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for y in 0..self.height {
            if y != 0 {
                write!(f, "\n")?;
            }
            for x in 0..self.width {
                let index = y * self.width + x;
                if x != 0 {
                    write!(f, " ")?;
                }
                write!(f, "{}", self.array[index].get())?;
            }
        }

        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct Pos(pub usize, pub usize);

impl<T: Clone> Array2D<T> {
    pub fn new(value: T, Pos(x, y): Pos) -> Array2D<T> {
        let array = vec![value; x * y];

        Array2D {
            array,
            width: x,
            height: y,
        }
    }

    pub fn get(&self, Pos(x, y): &Pos) -> Result<&T, &'static str> {
        let index = y * self.width + x;
        self.array.get(index).ok_or("Position is out of bounds.")
    }

    pub fn get_mut(&mut self, Pos(x, y): &Pos) -> Result<&mut T, &'static str> {
        let index = y * self.width + x;
        self.array
            .get_mut(index)
            .ok_or("Position is out of bounds.")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_array() {
        let arr = Array2D::new(0, Pos(3, 4));
        assert_eq!(arr.array, vec![0; 12]);

        let arr = Array2D::new(1, Pos(2, 3));
        assert_eq!(arr.array, vec![1; 6]);
    }
}
