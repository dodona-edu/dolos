module Modified exposing (rot, rot13)


rot : Int -> String -> String
rot y s =
    String.fromList (rotter y (String.toList s))


rot13 : String -> String
rot13 =
    rot 13


shift : Int -> Char -> Char
shift y c =
    if Char.isAlpha c then
        let
            off =
                if Char.isLower c then
                    97

                else
                    65

            tmp =
                Char.toCode c + y - off
        in
        Char.fromCode (remainderBy 26 tmp + off)

    else
        c


rotter : Int -> List Char -> List Char
rotter y s =
    case s of
        [] ->
            []

        c :: cs ->
            shift y c :: rotter y cs
