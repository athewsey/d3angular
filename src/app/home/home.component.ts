import {
  Component,
  OnInit
} from '@angular/core';

import { ViewEncapsulation } from "@angular/core";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { select as d3select, ValueFn } from "d3-selection";
import { Line, line } from "d3-shape";
import { AppState } from '../app.service';

const SCALE: number = 2;
const STEPSPERPX: number = 2;

class DiscreteGaussFilter {
  /**
   * Gaussian exponential factor relating x position to std deviation
   */
  expFactor: number;

  /**
   * Number of samples to each side of the central sample
   */
  nSideSamples: number;

  /**
   * Coefficient[AvailablePre][AvailablePost][ix]
   */
  coeffs: Array<Array<Array<number>>>;

  /**
   * 
   * @param stddev 
   * @param precision 
   */
  constructor(stddev, precision) {
    const me = this;
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

@Component({
  /**
   * TODO: A way to accommodate d3 dynamic DOM without breaking ViewEncapsulation
   */
  encapsulation: ViewEncapsulation.None,
  /**
   * The selector is what angular internally uses
   * for `document.querySelectorAll(selector)` in our index.html
   * where, in this case, selector is the string 'home'.
   */
  selector: 'home',  // <home></home>
  /**
   * We need to tell Angular's Dependency Injection which providers are in our app.
   */
  providers: [],
  /**
   * Our list of styles in our component. We may add more to compose many styles together.
   */
  styleUrls: [ './home.component.scss' ],
  /**
   * Every Angular template is first compiled by the browser before Angular runs it's compiler.
   */
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  width: number = (202 - 150);
  height: number = (250 - 15);
  scaleX: ScaleLinear<number, number> = scaleLinear();
  scaleY: ScaleLinear<number, number> = scaleLinear();
  /**
   * Set our default values
   */
  public localState = { value: '' };
  /**
   * TypeScript public modifiers
   */
  constructor(
    public appState: AppState
  ) {}


  public getPlotData() {
    const nSteps: number = this.height * STEPSPERPX;
    const time = Array.apply(null, { length: nSteps }).map((d, ix) => (ix / STEPSPERPX));
    const input = time.map((t) => (Math.random() * this.width));
    const gaussFilters = [
      new DiscreteGaussFilter(1.5, 4),
      new DiscreteGaussFilter(3, 4),
      new DiscreteGaussFilter(6, 4)
    ];
    const blurred = gaussFilters.map((f) => (f.filter(input)));
    return [
      time.map((t, ix) => ({ x: input[ix], y: t }))
    ].concat(blurred.map((output) => (
      output.map((x, ix) => ({ x: x, y: time[ix] }))
    )));
  }

  public ngOnInit() {
    const me = this;
    const plotData = this.getPlotData();
    const graphEl = document.getElementById("graph");
    graphEl.style.width = `${this.width * SCALE}px`;
    graphEl.style.height = `${this.height * SCALE}px`;
    this.scaleX.domain([0, this.width]).range([0, this.width * SCALE]);
    this.scaleY.domain([0, this.height]).range([0, this.height * SCALE]);
    const valLine: Line<any> = line()
      .x((d: any) => (me.scaleX(d.x)))
      .y((d: any) => (me.scaleY(d.y)));
    const svg = d3select(graphEl);
    const grp = svg.append("g");
    plotData.forEach((series, ix) => {
      grp.append("path").attr("class", `line line-${ix}`)
        .attr("d", valLine(series));
    });
  }

  public submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
