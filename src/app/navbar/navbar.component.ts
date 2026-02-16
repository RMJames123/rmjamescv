import { Component, OnInit, ChangeDetectorRef, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';   
import { PortafolioService } from '../servicios/portafolio.service';
import { LoadscriptsService } from './../servicios/loadscripts.service';
import { LanguageService } from '../servicios/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  selectedIdioma: string = ''; 
  mimenu: any[] = [];  
  lstidiomas: any[] = [];
  urlFotoPerfil: string = 'assets/img/Mi Foto.png'; 

  // Usamos inject para las nuevas versiones de Angular
  private injector = inject(Injector);
  private _CargaScripts = inject(LoadscriptsService);
  private datosPortafolio = inject(PortafolioService);
  private LangServ = inject(LanguageService);
  private cdRef = inject(ChangeDetectorRef);

  constructor() { 
    // Cargamos scripts de UI (animaciones de menú, etc.)
    this._CargaScripts.Carga(["toggleMenu"]);
  }

  ngOnInit(): void {
    // Sincronizamos el idioma visual con el servicio
    this.selectedIdioma = this.LangServ.sIdioma;

    // Ejecutamos las llamadas de Firebase dentro del contexto de inyección seguro
    runInInjectionContext(this.injector, () => {
      this.cargarListaIdiomas();
      this.cargarMenu();
      this.cargarImagenPerfil();
    });
  }

  private cargarListaIdiomas(): void {
    this.datosPortafolio.CargarIdiomas().subscribe({
      next: (resp) => {
        // Firebase a veces devuelve un objeto, nos aseguramos que sea Array
        this.lstidiomas = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error al cargar idiomas:', err)
    });
  }

  private cargarMenu(): void {
    this.datosPortafolio.CargarMenu().subscribe({
      next: (resp) => { 
        // Convertimos a array y ordenamos por el campo 'Orden' si existe
        const data = Array.isArray(resp) ? resp : Object.values(resp);
        this.mimenu = data.sort((a: any, b: any) => (a.Orden || 0) - (b.Orden || 0));
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error al cargar el menú:', err)
    });
  }

  private cargarImagenPerfil(): void {
    this.datosPortafolio.CargarFoto().subscribe({
      next: (resp) => {
        console.log("Foto OK:", resp);
        if (resp && resp.length > 0) {
          this.urlFotoPerfil = resp[0].Archivo;   
          this.cdRef.detectChanges();
        }
      },
      error: (err) => console.error("Error Foto:", err)
    });
  }

  salvar_Idioma(sIdioma: string) {
    if (sIdioma) {
      this.LangServ.grabar_language(sIdioma);
      // Recargamos para que todo el árbol de componentes tome el nuevo idioma desde Firebase
      window.location.reload();
    }
  }
}