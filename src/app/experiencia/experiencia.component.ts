import { Component, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; 
// Importamos la configuración directamente desde su submódulo:
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap/carousel'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-experiencia',
  standalone: true,
  imports: [CommonModule, NgbModule],
  // Importante: Asegúrate de que NgbCarouselConfig esté en providers si vas a modificar la config global aquí
  providers: [NgbCarouselConfig], 
  templateUrl: './experiencia.component.html',
  styleUrls: ['./experiencia.component.css']
})
export class ExperienciaComponent implements OnInit {
  private datosPortafolio = inject(PortafolioService);
  private _config = inject(NgbCarouselConfig);

  experiencia: any[] = [];
  titexperiencia: any[] = [];
  EmptyLeft = false;

  constructor() {
    this._config.interval = 10000;
}
  
  ngOnInit(): void {
    // Implementación de seguridad/rol maestro: 
    // Podrías verificar si el usuario tiene acceso total antes de cargar
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.datosPortafolio.CargarExperiencia().subscribe({
      next: (resp) => {
        this.experiencia = resp;
      },
      error: (err) => console.error('Error cargando experiencia:', err)
    });

    this.datosPortafolio.TituloExperiencia().subscribe({
      next: (resp) => {
        this.titexperiencia = resp;
      },
      error: (err) => console.error('Error cargando títulos:', err)
    });
  }

  IsEmptyLeft(): boolean {
    return this.EmptyLeft;
  }

  SwEmptyLeft(): boolean {
    this.EmptyLeft = !this.EmptyLeft;
    return false;
  }
}