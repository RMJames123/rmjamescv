import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { environment } from '../environments/environment';  
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // Esta es la pieza que suele faltar en Standalone para que el servicio "compat" funcione
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireDatabaseModule
    )
  ]
};

/*
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireDatabaseModule,
      NgbModule
    )
  ]
};

*/