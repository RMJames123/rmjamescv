import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Arrancamos la aplicación con el componente principal Standalone
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));