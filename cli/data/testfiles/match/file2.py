def some_other_code(list):
    when_list = True
    while when_list:
        random.shuffle(list)
        v = list[0]
        print(v)
        when_list = v % 10

def independent_function():
    file = open("./test")
    numbers = [int(x) for y in file for x in y.split(" ")]

    modulo_numbers = [ x % 5 for x in numbers]

    return sum(modulo_numbers)