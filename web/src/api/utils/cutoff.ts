import { Pair } from "@/api/models";

/**
 * Count the pairs in (overlapping) bins of similarity 'step'.
 *
 * This will only return bins up to the highest similarity, so empty bins below 1.00 will not be present.
 * This is not a problem in our situation since we only need the bins to search for local minima.
 *
 * @param pairs
 * @param step
 */
function getBinnedCount(pairs: Pair[], step = 0.05): number[] {
  const results: number[] = [];
  let upperCount = 0;
  let lowerCount = 0;
  let nextStep = step;
  for (const pair of pairs) {
    while (pair.similarity >= nextStep) {
      results.push(upperCount + lowerCount);
      lowerCount = upperCount;
      upperCount = 0;
      nextStep += step;
    }
    upperCount += 1;
  }

  results.push(upperCount + lowerCount);
  return results;
}


/**
 * Calculate the weighted distribution index.
 * @param index
 * @param top
 */
export function weightedDistributionIndex(index: number, top = 0.8): number {
  const a = 0.9 / (1 / 3 - top + top * top);
  const b = -2 * top * a;
  const c = -top * top * a - top * b + 0.1;

  return Math.round((a * index * index + b * index + c) * 1000) / 1000;
}

/**
 * Find a list of local minima in an array.
 * @param array
 */
export function getLocalMinima(array: number[]): number[] {
  const results: number[] = [];
  let currentDirection = array[0] < array[1];

  for (let i = 0; i < array.length - 1; i++) {
    const direction = array[i] < array[i + 1];
    if (direction !== currentDirection) {
      if (!currentDirection) {
        results.push(i);
      }
      currentDirection = direction;
    }
  }

  return results;
}

/**
 * Perform an interpolation for a good 'cutoff' similarity value, which is used to perform clustering later.
 * This algorithm is based upon a few rules of intuition:
 * 1. The correct value is generally quite high (between 0.6 and 0.85)
 * 2. The correct value is usually around a local minimum, because the dataset is
 * split between plagiarised pairs and non-plagiarised pairs, which should be on opposite sides of the graph (therefore
 * with a local minimum separating them).
 * 3. This local minimum should be relatively significant.
 * @param pairs
 * @param fileSimilarities
 * @param step
 */
export function guessSimilarityThreshold(pairs: Pair[], step = 0.03): number {
  pairs.sort((p1, p2) => p1.similarity - p2.similarity);

  let mean = 0;
  for (const pair of pairs) {
    mean += pair.similarity;
  }
  mean /= pairs.length;

  // Put the pairs in bins of similarity 'step'.
  const binnedCount = getBinnedCount(pairs, step);

  // Get an array of which bins are local minima (essentially: which bins have a higher neighbour on both sides)
  const localMinima = getLocalMinima(binnedCount);

  // Each of these bins have a weight based on the square root of their own value (we devalue 'big' local minima)
  // and also based on an approximate chance function which is centered around 0.75.
  const weightedLocalMinima = localMinima.map(
    (v) => (Math.sqrt(binnedCount[v]) + 1) * weightedDistributionIndex(v * step)
  );

  // We pick the lowest weighted index as the interpolated value
  const indexMin = weightedLocalMinima.reduce(
    (prev, curr, ind) => (weightedLocalMinima[prev] < curr ? prev : ind),
    0
  );

  // Convert the bin index with the lowest weight back to the similarity value this index represents
  const likelyMinimum = localMinima[indexMin] * step + (step / 2);

  // Sometimes, there are very few local minima, which results in a very low threshold.
  // To avoid this, the threshold should be at least the mean of the pairwise similarities.
  return Math.max(mean, likelyMinimum);
}
