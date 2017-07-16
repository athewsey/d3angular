import {
  Component,
  OnInit
} from '@angular/core';

import { AppState } from '../app.service';
import { ScaleLinear, scaleLinear } from "d3-scale";
import { select as d3select, ValueFn } from "d3-selection";
import { Line, line } from "d3-shape";

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
  width: number = 400;
  height: number = 200;
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

  public ngOnInit() {
    const me = this;
    const graphEl = document.getElementById("graph");
    graphEl.style.width = `${this.width}px`;
    graphEl.style.height = `${this.height}px`;
    this.scaleX.domain([0, 1]).range([0, this.width]);
    this.scaleY.domain([0, 1]).range([0, this.height]);
    const valLine: Line<any> = line()
      .x((d: any) => (me.scaleX(d.x)))
      .y((d: any) => (me.scaleY(d.y)));
    const svg = d3select(graphEl);
    const grp = svg.append("g");
    const ln = grp.append("path").attr("class", "line");
    // Calling .data gives a "parent is null" error?
    //ln.data([{ x: 0, y: 1 }, { x: 1, y: 0 }])
    //  .attr("d", valLine as ValueFn<any, any, string>);
    ln.attr("d", valLine([{ x: 0, y: 1 }, { x: 1, y: 0 }]))
      .attr("stroke", "blue")
      .attr("stroke-width", "2");
    console.log();
  }

  public submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
