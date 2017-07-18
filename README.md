# d3angular

I've used [d3.js](https://d3js.org/), [Angular v1.6](https://angularjs.org/) and [webpack](https://webpack.js.org/) in projects before, but wanted to play around with Angular v2/4.

This repo builds from the [AngularClass starter kit](https://github.com/AngularClass/angular-starter).

We take some uniform random noise as input, and compare a high-sigma Gaussian Blur of the input with the products of successive blurs and additive Normally distributed noise.

Normally distributed random variables are generated from uniform `Math.random()` by way of the [Box-Muller Transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform). The blur filter is custom and only approximate, using point values of `e^(-x^2)` rather than a proper integral discretisation.

Gaussian blurs are equivalent to the generalised [Weierstrass Transform](https://en.wikipedia.org/wiki/Weierstrass_transform). Research suggests close links between human perception and Gaussian windowing (e.g [Morlet/Gabor Filters](https://en.wikipedia.org/wiki/Morlet_wavelet) in visual and auditory perception) - so Gaussian-backed blob, edge, and wavelet detectors can be useful for picking out features in graphs/figures in a "human-like" way.