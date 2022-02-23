import random
def doing_cumulative_sum(list):
    l = 7
    el = 0

    j = 2
    for x in range(l):
        print(l)
        el += x

    return el


def code_with_random():
    list = []
    t = True
    while t:
        random.shuffle(list)
        print(list[-1])