# Source: https://rosettacode.org/wiki/Caesar_cipher#bash
caesar_cipher() {
  local -a _ABC=( "A" "B" "C" "D" "E" "F" "G" "H" "I" "J" "K" "L" "M" "N" "O" "P" "Q" "R" "S" "T" "U" "V" "W" "X" "Y" "Z" )
  local -a _abc=( "a" "b" "c" "d" "e" "f" "g" "h" "i" "j" "k" "l" "m" "n" "o" "p" "q" "r" "s" "t" "u" "v" "w" "x" "y" "z" )
 
  local _out
 
  if (( $# < 3 )) || [[ "$1" != "-e" && "$1" != "-d" ]] || (( $2 < 1 || $2 > 25 )); then
    echo "Usage: ${FUNCNAME[0]} -e|-d rotation (1-25) argument[(s)...]" >&2
    return 1
  fi
 
  _func="${1}"; shift
  _rotval="${1}"; shift
 
  while [[ -n "${1}" ]]; do
    for (( i = 0; i < ${#1}; i++ )); do
      for (( x = 0; x < ${#_abc[*]}; x++ )); do
        case "${_func}" in
          "-e")
            [[ "${1:$i:1}" == "${_ABC[$x]}" ]] && _out+="${_ABC[(( ( x + _rotval ) % 26 ))]}" && break
            [[ "${1:$i:1}" == "${_abc[$x]}" ]] && _out+="${_abc[(( ( x + _rotval ) % 26 ))]}" && break;;
          "-d")
            [[ "${1:$i:1}" == "${_ABC[$x]}" ]] && _out+="${_ABC[(( ( x - _rotval ) % 26 ))]}" && break
            [[ "${1:$i:1}" == "${_abc[$x]}" ]] && _out+="${_abc[(( ( x - _rotval ) % 26 ))]}" && break;;
        esac
        # If char has not been found by now lets add it as is.
        (( x == ${#_abc[*]} - 1 )) && _out+="${1:$i:1}"
      done
    done
    _out+=" "
    shift
  done
  echo "${_out[*]}"
}
