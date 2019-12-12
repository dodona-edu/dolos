All matches are predicted on results from MOSS. Details can be found in samples/python/benchmark_files/reports

# UPGMA_A
Solution of https://dodona.ugent.be/nl/courses/65/series/778/exercises/1448619298/
from student A

## File structure
DistanceMatrix:
- init
- str
- repr
- loadtxt
- savetxt
- nr_leaves
- limb_length
- additive_phylogeny
- find_i_n_k
- additive_phylogeny_rec
- UPGMA
- pairwise_distance

UnrootedTree:
- init
- str
- repr
- add_edge
- remove_edge
- loadtxt
- path
- distance
- path_dfs
- nr_leaf_nodes
- path_weight
- distance_matrix

Tree:
- init
- str
- rept

# UPGMA_A_copy.py
This is an exact copy of UPGMA_A.

# UPGMA_B
Solution of https://dodona.ugent.be/nl/courses/65/series/778/exercises/1448619298/
from student B.

Compared to A, should only give the functions `loadtxt` and `savetxt` as matches.
Since all other transformations are based on UPGMA_A and UPGMA_B, these matches will occur every single time.

# UPGMA_A_functionsmoved.py
Same file as UPGMA_A, but the order of classes and functions are shuffled.
## File structure
Tree:
- str
- init
- repr

DistanceMatrix:
- init
- loadtxt
- str
- find_i_n_k
- savetxt
- pairwise_distance
- nr_leaves
- limb_length
- additive_phylogeny
- repr
- UPGMA
- additive_phylogeny_rec

UnrootedTree:
- str
- add_edge
- repr
- distance
- remove_edge
- path
- init
- loadtxt
- path_weight
- distance_matrix
- path_dfs
- nr_leaf_nodes

Compared to A, everything should be recognised as a match, but matches occur at different linenumbers.


# UPGMA_A_linesmoved.py
Same file as UPGMA_A, but some lines are shuffled.
## Shuffled lines
- 37 - 39
- 67 - 68
- 135 - 136
- 141 - 142
- 164 - 165
- 210 - 213
All these changes are also annotated with comments in the file.

Compared to A, everything (the whole file and order) should still be recognised as a match.

# UPGMA_A_B_combined.py
This file is a combination of UPGMA_A and UPGMA_B.
## File structure
DistanceMatrix: `from A, except some functions from B`
- `A`: init
- `A`: str
- `A`: repr
- `A`: loadtxt
- `A`: savetxt
- `A`: nr_leaves
- `A`: limb_length
- `B`: additive_phylogeny
- `B`: additive_phylogeny_recursive
- `A`: UPGMA
- `A`: pairwise_distance

UnrootedTree: `from B`
- `B`: init
- `B`: repr
- `B`: loadtxt
- `B`: path
- `B`: distance_matrix

Tree: `from A`
- `A`init
- `A`: str
- `A`:rept

Compared to A, the classes/functions from A should be flagged as matches.
Compared to B, the classes/functions from B should be flagged as matches.

# UPGMA_A_variablenames.py
Same file as UPGMA_A, except some variable names are changed.
## Variable names changed
- self.D --> self.distances
- D --> distances

These changes leas to ±40 lines that are altered with different variable names.

Compared to A, everything (the whole file and order) should still be recognised as a match.

# UPGMA_A_functioncopied.py
Same file as UPGMA_A, except the function `loadtxt` is a strict copy from UPGMA_B.

Compared to A, everything except `loadtxt` should be flagged as a match.
Compared to B, `loadtxt` should be flagged as a match.