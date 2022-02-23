import random

def doing_cumulative_sum(list):
    var = 20
    el = 0
    newl = []

    for x in list:
        el += x
        newl.append(el)
    return newl

def some_other_code(list):
    when_list = True
    while when_list:
        random.shuffle(list)
        v = list[0]
        print(v)
        when_list = v % 10
