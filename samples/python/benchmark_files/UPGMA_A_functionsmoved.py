from collections import defaultdict

import numpy as np
import sys

class Tree:
    def __str__(self):
        subtrees_str = ", ".join([str(tree) for tree in self.subtrees])
        return type(self).__name__ + "(" + str(self.root) + (", " if len(self.subtrees) > 0 else "") + subtrees_str + ")"

    def __init__(self, root, *subtrees):
        self.root = root
        self.subtrees = subtrees

    def __repr__(self):
        return self.__str__()

class DistanceMatrix:
    def __init__(self, *args):
        self.D = np.array(*args)
        return

    @staticmethod
    def loadtxt(file_name, dtype=None, comments='#', delimiter=None, converters=None, skiprows=0, usecols=None, unpack=False, ndmin=0):
        D = np.loadtxt(file_name, dtype, comments, delimiter, converters, skiprows, usecols, unpack, ndmin)
        return DistanceMatrix(D)

    def __str__(self):
        return str([[float(a) for a in x] for x in self.D])

    def find_i_n_k(self, n):
        for i in range(n-1):
            for k in range(n-1):
                if i != k:
                    if self.D[i][k] == self.D[i][n-1] + self.D[n-1][k]:
                        return (i, n, k)
        return "nop"

    def savetxt(self, output_file, fmt='%.18e', delimiter=' ', newline='\n', header='', footer='', comments='# '):
        np.savetxt(output_file, self.D, fmt, delimiter, newline, header, footer, comments)
        return

    def pairwise_distance(self,C1, C2):
        n, m = len(C1), len(C2)
        s = sum([self.D[i][j] for i in C1 for j in C2])
        return s/(n*m)

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

    def additive_phylogeny(self):
        self.node_count = self.nr_leaves()
        return self.additive_phylogeny_rec(self, self.nr_leaves())

    def __repr__(self):
        return type(self).__name__ + "(" + str([[float(a) for a in x] for x in self.D]) + ")"

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

    def additive_phylogeny_rec(self, D, n):
        if n == 3:
            ll1 = (D.D[0][1] + D.D[1][2] - D.D[0][2])/2
            ll2 = D.D[1][2] - ll1
            ll0 = D.D[0][1] - ll1
            edges = {(0, self.node_count, ll0), (1, self.node_count, ll1), (2, self.node_count, ll2)}
            self.node_count += 1
            return UnrootedTree(*edges)

        ll = D.limb_length(n-1)
        D_bald = DistanceMatrix(D.D[:])
        for x in range(n-1):
            D_bald.D[n-1][x] -= ll
            D_bald.D[x][n-1] -= ll

        i,n,k = D_bald.find_i_n_k(n)
        x = D_bald.D[i][n-1]
        trimmed_D = DistanceMatrix([[D_bald.D[a][b] for a in range(n-1)] for b in range(n-1)])
        T = self.additive_phylogeny_rec(trimmed_D, n-1)
        path = T.path(i,k)
        i = 1
        while i < len(path) -1 and T.distance(path[0],path[i]) < x:
            i += 1

        if i is not 0 and  T.distance(path[0],path[i]) == x:
            T.add_edge(path[i-1],n-1,ll)
        else:
            a,b = path[i-1],path[i]
            new_d = D.D[path[0]][b] - x if b < len(D.D) else T.distance(path[0],b) - x
            T.add_edge(self.node_count, b, new_d)
            T.add_edge(a, self.node_count, T.distance(a,b) - new_d)
            T.add_edge(n-1, self.node_count, ll)
            T.remove_edge(a, b)
            self.node_count += 1

        return T

class UnrootedTree:
    def __str__(self):
        return type(self).__name__ + str(tuple(self.edges))

    def add_edge(self, a,b,w):
        self.edges.append((a,b,w))
        self.d[(a,b)] = w
        self.d[(b,a)] = w
        self.nb[a].append(b)
        self.nb[b].append(a)

    def __repr__(self):
        return type(self).__name__ + str(tuple(self.edges))

    def distance(self, i,j):
        if (i,j) in self.d:
            return self.d[(i,j)]
        else:
            path = self.path(i,j)
            return self.path_weight(path)

    def remove_edge(self,a,b):
        for edge in self.edges:
            x,y,w = edge
            if (x == a and b == y) or (x == b and y == a):
                self.edges.remove(edge)
                break
        del self.d[(a,b)]
        del self.d[(b,a)]
        self.nb[a].remove(b)
        self.nb[b].remove(a)

    def path(self, i, j):
        self.visited = [i]
        p = self.path_dfs(self.nb, i, j, [i])
        if p[0] != i:
            p = p [::-1]
        return p

    def __init__(self, *edges):
        self.edges = list()
        for edge in edges:
            a,b,c = edge
            a, b, c = int(a), int(b), float(c)
            self.edges.append((a,b,c))
        d = dict()
        for edge in self.edges:
            x, y, w = edge
            d[(x, y)] = w
            d[(y, x)] = w
        self.d = d
        nb = defaultdict(list)
        for edge in self.edges:
            x, y, w = edge
            nb[x].append(y)
            nb[y].append(x)
        self.nb = nb

    @staticmethod
    def loadtxt(input_file):
        edges = list()
        f = open(input_file)
        for line in f:
            line = line.rstrip().split(":")
            line[0] = line[0].split("<->")
            edges.append((line[0][0],line[0][1],line[1]))

        return UnrootedTree(*edges)

    def path_weight(self, path):
        s = 0
        for i in range(len(path) -1):
            s += self.d[(path[i],path[i+1])]
        return s

    def distance_matrix(self):
        n = self.nr_leaf_nodes()
        D = [[0 for _ in range(n)] for _ in range(n)]
        self.path_weight(self.path(0,2))
        for i in range(n):
            for j in range(i+1,n):
                path = self.path(i,j)
                w = self.path_weight(path)
        D[i][j], D[j][i] = w, w
        return DistanceMatrix(D)

    def path_dfs(self, graph, current_i, j, current_path):
        nb = graph[current_i]
        for n in nb:
            if n not in self.visited:
                self.visited.append(n)
                if n == j:
                    return current_path + [j]
                else:
                    r = self.path_dfs(graph, n, j, current_path + [n])
                    if r:
                        return r

    def nr_leaf_nodes(self):
        s = set()
        for edge in self.edges:
            x,y,w = edge
            if len(self.nb[x]) == 1:
                s.add(x)
            if len(self.nb[y]) == 1:
                s.add(y)
        return len(s)
