import { Component, OnInit, ChangeDetectorRef, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-testimonios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonios.component.html',
  styleUrls: ['./testimonios.component.css']
})
export class TestimoniosComponent implements OnInit {
  // Inyecciones mediante el motor de Angular
  private datosPortafolio = inject(PortafolioService);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  testimonio: any[] = [];
  tittestimonio: any[] = [];

  constructor() { }

  ngOnInit(): void {
    // Blindamos la ejecución para asegurar el contexto de NgZone en Firebase
    runInInjectionContext(this.injector, () => {
      this.cargarDatosTestimonios();
    });
  }

  private cargarDatosTestimonios(): void {
    // 1. Cargamos los títulos de la sección (ej: "Lo que dicen de mi trabajo")
    this.datosPortafolio.TituloTestimonios().subscribe({
      next: (resp) => {
        this.tittestimonio = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
        console.log("✅ Títulos de testimonios cargados:", this.tittestimonio);
      },
      error: (err) => console.error("❌ Error títulos testimonios:", err)
    });

    // 2. Cargamos los testimonios propiamente dichos
    this.datosPortafolio.CargarTestimonios().subscribe({
      next: (resp) => {
        console.log("✅ Datos de testimonios recibidos:", resp);
        this.testimonio = Array.isArray(resp) ? resp : Object.values(resp);
        // Forzamos la detección de cambios para que el renderizado sea inmediato
        this.cdRef.detectChanges();
      },
      error: (err) => console.error("❌ Error cargando testimonios:", err)
    });
  }
}