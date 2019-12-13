from collections import defaultdict

import numpy as np
import sys

#from A, except some functions
class DistanceMatrix:
    def __init__(self, *args):
        self.D = np.array(*args)
        return

    def __str__(self):
        return str([[float(a) for a in x] for x in self.D])

    def __repr__(self):
        return type(self).__name__ + "(" + str([[float(a) for a in x] for x in self.D]) + ")"

    @staticmethod
    def loadtxt(file_name, dtype=None, comments='#', delimiter=None, converters=None, skiprows=0, usecols=None, unpack=False, ndmin=0):
        D = np.loadtxt(file_name, dtype, comments, delimiter, converters, skiprows, usecols, unpack, ndmin)
        return DistanceMatrix(D)

    def savetxt(self, output_file, fmt='%.18e', delimiter=' ', newline='\n', header='', footer='', comments='# '):
        np.savetxt(output_file, self.D, fmt, delimiter, newline, header, footer, comments)
        return

    def nr_leaves(self):
        return len(self.D)

    def limb_length(self, j):
        n = self.nr_leaves()
        assert(j < n)
        minimum = sys.maxsize
        for i in range(n):
            if i != j:
                for k in range(n):
                    if k != j:
                        Dij = self.D[i][j]
                        Djk = self.D[j][k]
                        Dik = self.D[i][k]
                        minimum = min([minimum, (Dij+Djk-Dik)/2])
        return minimum

    #from B
    def additive_phylogeny(self):
        self.max_node = len(self.matrix)
        return UnrootedTree(*sorted(self.additive_phylogeny_recursive(self.matrix, len(self.matrix))))

    #from B
    def additive_phylogeny_recursive(self, mat, n):
        if n == 2:
            return [(0, 1, mat[0][1])]
        limb_size = DistanceMatrix.limb_length_from_matrix(mat[:n, :n], n - 1)
        for j in range(n - 1):
            mat[n - 1][j] = mat[n - 1][j] - limb_size
            mat[j][n - 1] = mat[n - 1][j]
        for i in range(n - 1):
            found = False
            for k in range(i, n - 1):
                if mat[i][k] == mat[i][n - 1] + mat[k][n - 1]:
                    found = True
                    break
            if found:
                break
        x = mat[i][n - 1]
        tree_list = self.additive_phylogeny_recursive(mat.copy(), n - 1)
        tree = UnrootedTree(*tree_list)
        path = tree.path(i, k)
        for j in range(1, len(path)):
            edge = (path[j - 1], path[j])
            edge_sorted = tuple(sorted(edge))
            if tree.edges[edge_sorted] > x:
                tree_list.remove((edge_sorted[0], edge_sorted[1], tree.edges[edge_sorted]))
                tree_list.append((edge[0], self.max_node, x))
                tree_list.append((edge[1], self.max_node, tree.edges[edge_sorted] - x))
                tree_list.append((n - 1, self.max_node, limb_size))
                self.max_node += 1
                break
            elif tree.edges[edge_sorted] == x:
                new_edge = sorted((n - 1, edge[1]))
                tree_list.append((new_edge[0], new_edge[1], limb_size))
                break
            else:
                x -= tree.edges[edge_sorted]

        return tree_list

    def UPGMA(self):
        self.nr_count = self.nr_leaves()
        clusters = [{i} for i in range(self.nr_leaves())]
        trees = [Tree(i) for i in range(self.nr_leaves())]
        ages = [0 for _ in range(self.nr_leaves())]
        while len(clusters) > 1:
            min_d = sys.maxsize
            min_C1, min_C2 = None, None
            n = len(clusters)
            for i in range(n):
                for j in range(i+1,n):
                    C1, C2 = clusters[i], clusters[j]
                    d = self.pairwise_distance(C1,C2)
                    if d < min_d:
                        min_d = d
                        min_C1, min_C2 = C1, C2

            C1_index, C2_index = clusters.index(min_C1), clusters.index(min_C2)
            age = min_d/2
            clusters[C1_index] = min_C1 | min_C2
            clusters.pop(C2_index)
            trees[C1_index] = Tree(self.nr_count, (trees[C1_index], age - ages[C1_index]), (trees[C2_index], age - ages[C2_index] ))
            trees.pop(C2_index)
            ages[C1_index] = age
            ages.pop(C2_index)
            self.nr_count += 1
        return trees[0]

    def pairwise_distance(self,C1, C2):
        n, m = len(C1), len(C2)
        s = sum([self.D[i][j] for i in C1 for j in C2])
        return s/(n*m)

#from B completely
class UnrootedTree:

    def __init__(self, *args):
        self.graph = defaultdict(set)
        self.edges = defaultdict(int)
        self.nodes = set()
        self.edges_list = list()
        self.leaves = set()
        for tup in args:
            self.graph[tup[0]].add((tup[1]))
            self.graph[tup[1]].add((tup[0]))
            self.edges[tuple(sorted((tup[0], tup[1])))] = tup[2]
            self.edges_list.append((tup[0], tup[1], float(tup[2])))
            self.nodes.add(tup[0])
            self.nodes.add(tup[1])
        for key, val in self.graph.items():
            if len(val) == 1:
                self.leaves.add(key)

    def __repr__(self):
        repr_str = "UnrootedTree("
        for edge in self.edges_list:
            repr_str += str(edge) + ", "
        return repr_str[:-2] + ")"

    @staticmethod
    def loadtxt(f):
        with open(f, "r") as graph_file:
            tuple_list = []
            for line in graph_file:
                line_arr = line.strip().split("<->")
                rhs = line_arr[1].split(":")
                tuple_list.append((int(line_arr[0]), int(rhs[0]), float(rhs[1])))
            return UnrootedTree(*tuple_list)

    def path(self, first_node, second_node):
        stack = [(first_node, [first_node])]
        while stack:
            (vertex, path) = stack.pop()
            for next_vertex in self.graph[vertex] - set(path):
                if next_vertex == second_node:
                    return path + [next_vertex]
                else:
                    stack.append((next_vertex, path + [next_vertex]))

    def distance_matrix(self):
        mat = [[0 for _ in range(len(self.leaves))] for _ in range(len(self.leaves))]
        for n1 in self.leaves:
            for n2 in self.leaves:
                if n1 < n2:
                    path = self.path(n1, n2)
                    length = 0
                    for i in range(1, len(path)):
                        length += self.edges[tuple(sorted((path[i - 1], path[i])))]
                    mat[n1][n2] = length
                    mat[n2][n1] = length
        return DistanceMatrix(mat)

#from A
class Tree:
    def __init__(self, root, *subtrees):
        self.root = root
        self.subtrees = subtrees

    def __str__(self):
        subtrees_str = ", ".join([str(tree) for tree in self.subtrees])
        return type(self).__name__ + "(" + str(self.root) + (", " if len(self.subtrees) > 0 else "") + subtrees_str + ")"

    def __repr__(self):
        return self.__str__()
