module Caesar exposing (rot, rot13)


shiftChar : Int -> Char -> Char
shiftChar x char =
    if Char.isAlpha char then
        let
            base =
                if Char.isUpper char then
                    65

                else
                    97

            charCode =
                Char.toCode char - base + x
        in
        Char.fromCode (base + remainderBy 26 charCode)

    else
        char


rotInternal : Int -> List Char -> List Char
rotInternal x input =
    case input of
        [] ->
            []

        c :: cs ->
            shiftChar x c :: rotInternal x cs


rot : Int -> String -> String
rot x input =
    String.fromList (rotInternal x (String.toList input))


rot13 : String -> String
rot13 =
    rot 13
