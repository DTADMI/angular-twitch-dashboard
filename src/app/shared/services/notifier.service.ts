import { Injectable } from '@angular/core';
import {MatSnackBar} from "@angular/material/snack-bar";
import {NotifierComponent} from "../../components/notifier/notifier.component";

@Injectable({
  providedIn: 'root'
})
export class NotifierService {

  constructor(private snackBar: MatSnackBar) { }

  showNotification = (displayedMessage: string, buttonText: string, messageType: 'error' | 'success' | 'warning') => {
    this.snackBar.openFromComponent(NotifierComponent, {
      data: {
        message: displayedMessage,
        buttonText: buttonText,
        type: messageType
      },
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: messageType
    });
  }
}
