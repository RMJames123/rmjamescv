import { Component, OnInit, ChangeDetectorRef, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { NgbCarouselConfig, NgbModule } from '@ng-bootstrap/ng-bootstrap'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-capacitaciones',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './capacitaciones.component.html',
  styleUrls: ['./capacitaciones.component.css'],
  providers: [NgbCarouselConfig]
})
export class CapacitacionesComponent implements OnInit {
  // Inyección de dependencias moderna
  private datosPortafolio = inject(PortafolioService);
  private _config = inject(NgbCarouselConfig);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  capacitaciones: any[] = [];
  titcapacitaciones: any[] = [];

  constructor() { 
    // Configuración personalizada del Carrusel de Capacitaciones
    this._config.interval = 5000;
    this._config.wrap = true;
    this._config.keyboard = false;
    this._config.pauseOnHover = false;
    this._config.showNavigationIndicators = true; // Útil para certificaciones
  }

  ngOnInit(): void {
    // Blindaje de contexto para Angular Fire
    runInInjectionContext(this.injector, () => {
      this.cargarDatosCapacitaciones();
    });
  }

  private cargarDatosCapacitaciones(): void {
    // 1. Cargar las certificaciones y cursos
    this.datosPortafolio.CargarCapacitaciones().subscribe({
      next: (resp) => {
        console.log("✅ Capacitaciones cargadas:", resp);
        const lista = Array.isArray(resp) ? resp : Object.values(resp);
        // Ordenamos por fecha o id de forma descendente si lo prefieres
        this.capacitaciones = [...lista].reverse();
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error en servicio de capacitaciones:', err)
    });

    // 2. Cargar el título dinámico (ej: "Certificaciones" / "Trainings")
    this.datosPortafolio.TituloCapacitaciones().subscribe({
      next: (resp) => {
        this.titcapacitaciones = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error al cargar título de capacitaciones:', err)
    });
  }
}