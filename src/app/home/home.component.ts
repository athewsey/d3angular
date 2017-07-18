// NPM Dependencies
import { Component, OnInit } from "@angular/core";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { select as d3select, ValueFn } from "d3-selection";
import { Line, line } from "d3-shape";

// Local Dependencies
import { AppState } from '../app.service';
import { DiscreteGaussFilter, genNormal } from "../../util/sigproc";

// Configuration
/**
 * This app was used to draw a graph at specific size for a specific purpose, so it does some kinda
 * skewy absolute sizing stuff.
 */
const SCALE: number = 2;
const STEPSPERPX: number = 2;

@Component({
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
  height: number = (285 - 17.5);
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
    const time = Array.apply(null, { length: nSteps }).map((nothing, ix) => (ix / STEPSPERPX));
    const input = time.map((t, ix) => (
      (this.width / 2)
      + (Math.random() * this.width - (this.width / 2))
      * Math.min(1, ix * STEPSPERPX / 100)
    ));
    const normGenerator = genNormal();
    const gaussFilters = [
      new DiscreteGaussFilter(1.5, 4),
      new DiscreteGaussFilter(1.5, 4),
      new DiscreteGaussFilter(2, 4),
      new DiscreteGaussFilter(2, 4),
      new DiscreteGaussFilter(2, 4),
      new DiscreteGaussFilter(3, 4),
      new DiscreteGaussFilter(7, 4)
    ];
    let blurred = [];
    gaussFilters.forEach((f, ix) => {
      blurred.push(
        f.filter((blurred[ix - 1] || input).map(
          // 12 = 2 directions * 3 approx std deviation limit * 2 shrinking factor:
          (x, ix) => (Math.max(0, Math.min(
            this.width,
            x + (normGenerator.next().value * this.width / 12) * Math.min(1, ix * STEPSPERPX / 100)
          )))
        ))
      )
    });

    // We only actually want to plot a few of the intermediate stages
    blurred = [blurred[3], blurred[6]];
    return [
      time.map((t, ix) => ({ x: input[ix], y: t }))
    ].concat(
      blurred.map((output) => (
        output.map((x, ix) => ({
          x: x,
          y: time[ix]
        }))
      )),
      [gaussFilters[gaussFilters.length - 1].filter(input).map((x, ix) => ({ x: x, y: time[ix] }))]
    );
  }

  public ngOnInit() {
    const me = this;
    const plotData = this.getPlotData();
    console.log(plotData);
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
        // TODO: Find way for download to preserve CSS, and move this styling back to CSS.
        // (Will need to re-break ViewEncapsulation for that to work)
        .attr("fill", "none")
        .attr("stroke", ["#e0e0e0", "#aaa", "#666", "black", "red"][ix])
        .attr("d", valLine(series));
    });
    
    const linkEl = document.getElementById("graphDownload");
    linkEl.setAttribute("href", `data:image/svg+xml;base64,\n${window.btoa(graphEl.outerHTML)}`);
  }
}
