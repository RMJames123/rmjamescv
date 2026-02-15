import { Component, OnInit, inject, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { NgbModule, NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-experiencia',
  standalone: true,
  imports: [CommonModule, NgbModule],
  providers: [NgbCarouselConfig], 
  templateUrl: './experiencia.component.html',
  styleUrls: ['./experiencia.component.css']
})
export class ExperienciaComponent implements OnInit {
  // Inyecciones modernas
  private datosPortafolio = inject(PortafolioService);
  private _config = inject(NgbCarouselConfig);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  experiencia: any[] = [];
  titexperiencia: any[] = [];

  constructor() {
    // Configuración del carrusel
    this._config.interval = 10000;
    this._config.wrap = true;
    this._config.keyboard = false;
    this._config.pauseOnHover = true;
  }
  
  ngOnInit(): void {
    // Aplicamos el contexto de inyección para evitar el error NG0203
    runInInjectionContext(this.injector, () => {
      this.cargarDatos();
    });
  }

  private cargarDatos(): void {
    // 1. Cargar la lista de experiencias profesionales
    this.datosPortafolio.CargarExperiencia().subscribe({
      next: (resp) => {
        console.log("✅ Datos de Experiencia:", resp);
        // Convertimos a array y los invertimos para mostrar lo más reciente primero
        const lista = Array.isArray(resp) ? resp : Object.values(resp);
        this.experiencia = [...lista].reverse(); 
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error cargando experiencia:', err)
    });

    // 2. Cargar el título de la sección (ej: "Experiencia Laboral")
    this.datosPortafolio.TituloExperiencia().subscribe({
      next: (resp) => {
        this.titexperiencia = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error cargando títulos:', err)
    });
  }
}