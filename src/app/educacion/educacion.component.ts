import { Component, OnInit, inject, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-educacion',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './educacion.component.html',
  styleUrls: ['./educacion.component.css']
})
export class EducacionComponent implements OnInit {
  // Inyecciones modernas
  private datosPortafolio = inject(PortafolioService);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  educacion: any[] = [];
  titeducacion: any = {}; 

  constructor() { }

  ngOnInit(): void {
    // Ejecutamos dentro del contexto de inyección para asegurar la compatibilidad con Firebase
    runInInjectionContext(this.injector, () => {
      this.cargarDatosEducacion();
    });
  }

  private cargarDatosEducacion(): void {
    // 1. Cargar la lista de formación académica
    // IMPORTANTE: Verifica que en tu PortafolioService el método se llame exactamente CargarEducacion()
    this.datosPortafolio.CargarEducacion().subscribe({
      next: (resp) => {
        console.log("🔍 Intentando cargar Educación. Datos recibidos:", resp);
        
        if (resp) {
          // Firebase puede devolver un objeto o un array. Convertimos a array siempre.
          const lista = Array.isArray(resp) ? resp : Object.values(resp);
          
          // Filtramos elementos nulos y revertimos para mostrar lo más reciente arriba
          this.educacion = lista.filter(item => item !== null).reverse(); 
          
          console.log("✅ Educación procesada correctamente:", this.educacion);
          
          // Forzamos la actualización de la vista
          this.cdRef.markForCheck(); 
          this.cdRef.detectChanges();
        } else {
          console.warn("⚠️ El servicio devolvió datos vacíos para Educación.");
        }
      },
      error: (err) => {
        console.error('❌ Error crítico al conectar con la sección Educación:', err);
      }
    });

    // 2. Cargar el título (Solo si el método existe en el servicio)
    if (this.datosPortafolio.TituloEducacion) {
      this.datosPortafolio.TituloEducacion().subscribe({
        next: (resp) => {
          if (resp) {
            this.titeducacion = Array.isArray(resp) ? resp[0] : resp;
            this.cdRef.detectChanges();
          }
        }
      });
    }
  }
}