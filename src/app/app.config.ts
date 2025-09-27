import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BoardComponent } from './components/board/board.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      { path: '', component: BoardComponent }
    ]),
    provideHttpClient()
  ]
};
