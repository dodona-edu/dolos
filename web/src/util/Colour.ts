type Colour = string; // a 6-digit hex value representing a colour with a leading #

function d2h(d: number): string {
  return d.toString(16);
}

function h2d(h: string): number {
  return parseInt(h, 16);
}

/**
 * Mixes the two given colours into one with respect to the given weight. If the weight is 0 or 1 then the output colour
 * will be equal to colour2 and colour1 respectively.
 * @param colour1 The first colour
 * @param colour2 The second colour
 * @param weight the weight balance.
 */
export function mix(colour1: Colour, colour2: Colour, weight: number = 0.5): Colour {
  let colour = "#"
  for(let i = 0; i <= 5; i += 2) {
    const v1 = h2d(colour1.substr(i, 2));
    const v2 = h2d(colour2.substr(i, 2));
    let val = d2h(Math.round(v2 + (v1 - v2) * weight ));

    while(val.length < 2) {
      val = "0" + val;
    }
    colour += val;
  }
  return colour;
}
