import {Component, ViewChild} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
  @ViewChild('drawer') drawer: any;
  isHandset:boolean = false;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.isHandset$.subscribe(currentObservableValue => {
      this.isHandset = currentObservableValue;
      this.toggleNavBar();
    });
  }

  public toggleNavBar() {
    if(this.isHandset) {
      this.drawer.toggle();
    }
  }
}
