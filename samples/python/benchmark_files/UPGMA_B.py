import numpy as np
from collections import defaultdict
from math import inf

class DistanceMatrix:

    def __init__(self, object, dtype=None, copy=True, order='K', subok=False, ndmin=0):
        self.matrix = np.array(object, dtype=dtype, copy=copy, order=order, subok=subok, ndmin=ndmin)
        self.max_node = len(self.matrix)
        is_symmetric = np.allclose(self.matrix, self.matrix.T, atol=1e-8)
        is_all_positive = self.matrix.min() >= 0
        diagonal_is_zero = np.count_nonzero(np.diagonal(self.matrix)) == 0
        if not is_symmetric or not is_all_positive or not diagonal_is_zero:
            raise ValueError("invalid distance matrix")

    @staticmethod
    def loadtxt(fname, dtype=np.float, comments='#', delimiter=None, converters=None, skiprows=0, usecols=None, unpack=False, ndmin=0):
        matrix = np.loadtxt(fname, dtype, comments, delimiter, converters, skiprows, usecols, unpack, ndmin)
        return DistanceMatrix(matrix, dtype, ndmin=ndmin)

    def savetxt(self, fname, fmt='%.18e', delimiter=' ', newline='\n', header='', footer='', comments='# '):
        np.savetxt(fname, self.matrix, fmt, delimiter, newline, header, footer, comments)

    def limb_length(self, j):
        return DistanceMatrix.limb_length_from_matrix(self.matrix, j)

    @staticmethod
    def limb_length_from_matrix(mat, j):
        n = len(mat)
        min_length = inf
        for i in range(n):
            for k in range(i + 1, n):
                if i != j and k != j:
                    length = (mat[i][j] + mat[j][k] - mat[i][k]) / 2
                    if length < min_length:
                        min_length = length
        return min_length

    def additive_phylogeny(self):
        self.max_node = len(self.matrix)
        return UnrootedTree(*sorted(self.additive_phylogeny_recursive(self.matrix, len(self.matrix))))

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
        clusters = dict()
        cluster_mapping = dict()
        trees = dict()
        ages = dict()
        mat = self.matrix.copy()
        for i in range(len(self.matrix)):
            clusters[i] = set([i])
            cluster_mapping[i] = i
            trees[i] = Tree(i)
            ages[i] = 0
        self.max_node = len(self.matrix)

        while len(clusters) > 1:
            closest_clusters_distance = inf
            for i in clusters.keys():
                for j in clusters.keys():
                    if i != j:
                        dist = mat[cluster_mapping[i]][cluster_mapping[j]]
                        if dist < closest_clusters_distance:
                            closest_clusters = (i, j)
                            closest_clusters_distance = dist

            i, j = closest_clusters

            new_cluster = clusters[i].union(clusters[j])
            new_tree = Tree(self.max_node, (trees[i], 0), (trees[j], 0))
            del trees[i]
            del trees[j]
            trees[self.max_node] = new_tree
            ages[self.max_node] = closest_clusters_distance / 2
            cluster_mapping[self.max_node] = cluster_mapping[i]
            del cluster_mapping[i]
            del cluster_mapping[j]
            del clusters[i]
            del clusters[j]
            clusters[self.max_node] = new_cluster

            for i, cluster in clusters.items():
                if i != self.max_node:
                    distance = self.get_cluster_distance(new_cluster, cluster)
                    mat[cluster_mapping[self.max_node]][cluster_mapping[i]] = distance
                    mat[cluster_mapping[i]][cluster_mapping[self.max_node]] = distance

            self.max_node += 1

        root = list(trees.values())[0]
        DistanceMatrix.set_age(ages, root)
        return root

    @staticmethod
    def set_age(ages, node):
        for child in node.children.keys():
            node.children[child] = ages[node.label] - ages[child.label]
            if child.children:
                DistanceMatrix.set_age(ages, child)

    def get_cluster_distance(self, c1, c2):
        distance = 0
        for i in c1:
            for j in c2:
                distance += self.matrix[i][j]
        distance /= len(c1) * len(c2)
        return distance

    def __repr__(self):
        return "DistanceMatrix(" + str(self) + ")"

    def __str__(self):
        mat_string = "["
        for row in self.matrix:
            mat_string += "["
            for val in row:
                mat_string += str(val) + ", "
            mat_string = mat_string[:-2] + "], "
        mat_string = mat_string[:-2] + "]"
        return mat_string

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

class Tree:

    def __init__(self, label, *args):
        self.label = label
        self.children = dict()
        for child in args:
            self.children[child[0]] = child[1]

    def __repr__(self):
        repr_str = "Tree(" + str(self.label) + ", "
        for child, weight in self.children.items():
            repr_str += "(" + child.__repr__() + ", " + str(weight) + "), "
        return repr_str[:-2] + ")"

if __name__ == "__main__":
    D = DistanceMatrix.loadtxt('distances.txt')
    print(D.UPGMA())
