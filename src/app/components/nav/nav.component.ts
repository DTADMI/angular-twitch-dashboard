import {Component, ViewChild} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {NotifierService} from "../../shared/services/notifier.service";

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

  constructor(private breakpointObserver: BreakpointObserver,
              public notifierService: NotifierService) {}

  ngOnInit() {
    this.isHandset$.subscribe(currentObservableValue => {
      this.isHandset = currentObservableValue;
    });
  }

  public toggleNavBar() {
    if(this.isHandset) {
      if(this.drawer) {
        this.drawer.toggle();
      } else {
        this.notifierService.showNotification("The page did not load properly. Please reload.", "OK", "warning");
      }
    }
  }
}
