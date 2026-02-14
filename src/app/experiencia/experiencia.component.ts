import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; 
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap/carousel'; 
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
  private datosPortafolio = inject(PortafolioService);
  private _config = inject(NgbCarouselConfig);
  private cdRef = inject(ChangeDetectorRef); // Inyectamos detector de cambios

  experiencia: any[] = [];
  titexperiencia: any[] = [];

  constructor() {
    this._config.interval = 10000;
  }
  
  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.datosPortafolio.CargarExperiencia().subscribe({
      next: (resp) => {
        // Convertimos a array si Firebase devuelve objeto y ordenamos (opcional)
        this.experiencia = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error cargando experiencia:', err)
    });

    this.datosPortafolio.TituloExperiencia().subscribe({
      next: (resp) => {
        this.titexperiencia = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error cargando títulos:', err)
    });
  }
}