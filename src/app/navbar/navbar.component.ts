import { Component, OnInit } from '@angular/core';
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

  // 1. Solo declaramos la variable, no la inicializamos con el servicio aquí
  selectedIdioma: string = ''; 
  mimenu: any[] = [];
  lstidiomas: any[] = [];

  constructor(
    private _CargaScripts: LoadscriptsService,
    private datosPortafolio: PortafolioService,
    private LangServ: LanguageService
  ) { 
    // 2. Cargamos scripts de UI
    this._CargaScripts.Carga(["toggleMenu"]);
    // 3. Inicializamos el idioma después de que el servicio ha sido inyectado
    this.selectedIdioma = this.LangServ.sIdioma;
  }

  ngOnInit(): void {
    // Implementación de carga de datos con manejo de errores básico
    this.datosPortafolio.CargarIdiomas().subscribe({
      next: (resp) => this.lstidiomas = resp,
      error: (err) => console.error('Error idiomas:', err)
    });

    this.datosPortafolio.CargarMenu().subscribe({
      next: (resp) => this.mimenu = resp,
      error: (err) => console.error('Error menu:', err)
    });
  }

  salvar_Idioma(sIdioma: string) {
    this.LangServ.grabar_language(sIdioma);
    window.location.reload();
  }
}