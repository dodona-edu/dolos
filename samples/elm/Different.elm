module Different exposing (rot, rot13)


rot13 : String -> String
rot13 =
    rot 13


rot : Int -> String -> String
rot x input =
    String.map (shift x) input


offset : Char -> Int
offset char =
    if Char.isUpper char then
        65

    else
        97


shift : Int -> Char -> Char
shift x char =
    let
        base =
            offset char

        charCode =
            Char.toCode char - base + x
    in
    Char.fromCode (base + remainderBy 26 charCode)
