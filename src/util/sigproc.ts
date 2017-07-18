/**
 * Signal processing utilities for the demo
 */

/**
 * Produce standard Normally-distributed variables from calls to Math.random() using the 
 * [Box-Muller](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform) transform.
 * 
 * Because Box-Muller gives us two at a time, it's a nice use case for a Generator fn.
 */
export function* genNormal() {
  var next: number;
  
  while (1) {
    if (typeof next === "undefined") {
      const x0 = 1.0 - Math.random();
      const x1 = 1.0 - Math.random();

      next = (Math.sqrt(-2.0 * Math.log(x0)) * Math.sin(2.0 * Math.PI * x1));
      yield Math.sqrt(-2.0 * Math.log(x0)) * Math.cos(2.0 * Math.PI * x1);
    }
    else {
      const result = next;
      next = undefined;
      yield result;
    }
  }
}

/**
 * Basic implementation of a Gaussian filter
 */
export class DiscreteGaussFilter {
  /**
   * Gaussian exponential factor relating x position to std deviation
   */
  expFactor: number;

  /**
   * Number of samples to each side of the central sample
   */
  nSideSamples: number;

  /**
   * For fast processing of edge values where insufficient samples are available for the full
   * filter, we will store normalised coefficient arrays for all possible combinations of 
   * (Available samples before current) and (Available samples after current).
   * Coefficient[AvailablePre][AvailablePost][ix]
   */
  coeffs: Array<Array<Array<number>>>;

  /**
   * @param {number} stddev Standard deviation of the filter (units = number of samples)
   * @param {number} precision=5 How many standard deviations the filter should extend.
   */
  constructor(stddev: number, precision: number) {
    const me = this;
    precision = precision || 5;

    this.expFactor = -1 / (2 * stddev ** 2);
    this.nSideSamples = Math.max(1, Math.round(stddev * precision));

    // Exponential coefficients for the forward half of the filter (symmetric):
    // Array.apply.map to initialise array of given size
    const halfExps = Array.apply(
      null,
      { length: this.nSideSamples }
    ).map((nothing, ix) => (
      Math.exp(me.expFactor * (ix + 1) ** 2)
    ));

    // Cumulative sum of this and following halfExps.
    const halfSums = halfExps.reduce(
      (acc: Array<number>, next: number, ix: number) => {
        // [][-1] = undefined, no error
        acc.push(next + (acc[ix - 1] || 0));
        return acc;
      },
      []
    );

    this.coeffs = Array.apply(
      null,
      { length: this.nSideSamples + 1 }
    ).map((nothing, ixAvailPre) => (
      Array.apply(
        null,
        { length: this.nSideSamples + 1 }
      ).map((nothing, ixAvailPost) => {
        const coeffSum = (halfSums[ixAvailPre - 1] || 0) + 1 + (halfSums[ixAvailPost - 1] || 0);
        return halfExps
          .slice(0, ixAvailPre)
          .reverse()
          .concat(1, halfExps.slice(0, ixAvailPost))
          .map((d) => (d / coeffSum));
      })
    ));
  }

  /**
   * @param {Array<number>} input samples
   * @returns {Array<number>} filter output
   */
  filter(input: Array<number>): Array<number> {
    const me = this;
    const len = input.length;
    return input.map((d, ix) => {
      const availablePre = Math.min(ix, me.nSideSamples);
      const availablePost = Math.min(len - (ix + 1), me.nSideSamples);
      const coeffs = me.coeffs[availablePre][availablePost];
      return input.slice(
        ix - availablePre,
        ix + availablePost + 1
      ).reduce((acc, nextIn, ix) => (
        acc + nextIn * coeffs[ix]
      ), 0);
    });
  }
}
