LABYRINTH = [
  "XXXXXXXXXX",
  "  XX  XX S",
  "X XX  X  X",
  "X  X    XX",
  "X        X",
  "XXXXXXXXXX"
]

def find_path(labyrinth, x, y):
  if (y < 0 or y >= len(labyrinth) or x < 0 or x >= len(labyrinth[y])): return False
  if (labyrinth[y][x] == "S"): 
    print_labyrinth(labyrinth)
    return True
  if (labyrinth[y][x] != " "): return False
  labyrinth_copy = labyrinth.copy()
  row_copy = list(labyrinth[y])
  row_copy[x] = "+"
  labyrinth_copy[y] = "".join(row_copy)
  return find_path(labyrinth_copy, x - 1, y) or \
    find_path(labyrinth_copy, x + 1, y) or \
    find_path(labyrinth_copy, x, y - 1) or \
    find_path(labyrinth_copy, x, y + 1)

def print_labyrinth(labyrinth): print("\n".join(labyrinth));

find_path(LABYRINTH, 0, 1)
