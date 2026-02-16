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
  private datosPortafolio = inject(PortafolioService);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  // Inicializamos como arrays vacíos para evitar errores antes de que lleguen los datos
  educacion: any[] = [];
  titeducacion: any[] = []; 

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      this.cargarDatosEducacion();
    });
  }

  private cargarDatosEducacion(): void {
    // 1. Cargar Lista de Educación
    this.datosPortafolio.CargarEducacion().subscribe({
      next: (resp) => {
        if (resp) {
          // CONVERSIÓN CRÍTICA: Si es objeto, lo pasamos a Array. Si es Array, lo usamos.
          const lista = Array.isArray(resp) ? resp : Object.values(resp);
          
          // Filtramos nulos y ordenamos
          this.educacion = lista.filter(item => item !== null).reverse(); 
          this.cdRef.detectChanges();
        }
      },
      error: (err) => console.error('Error Educación:', err)
    });

    // 2. Cargar Título (Aquí es donde solía fallar el ngFor)
    this.datosPortafolio.TituloEducacion().subscribe({
      next: (resp) => {
        if (resp) {
          // Aseguramos que titeducacion sea SIEMPRE un Array para el *ngFor del HTML
          this.titeducacion = Array.isArray(resp) ? resp : Object.values(resp);
          this.cdRef.detectChanges();
        }
      }
    });
  }
}