import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngFor y *ngIf
import { NgbCarouselConfig, NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Importación de Bootstrap
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-capacitaciones',
  standalone: true, // Modo Standalone activado
  imports: [CommonModule, NgbModule], // Importamos NgbModule para que funcione el inyector de config
  templateUrl: './capacitaciones.component.html',
  styleUrls: ['./capacitaciones.component.css'],
  providers: [NgbCarouselConfig] // Añadimos el provider aquí para asegurar la inyección
})
export class CapacitacionesComponent implements OnInit {

  capacitaciones: any[] = [];
  titcapacitaciones: any[] = [];
  EmptyLeftT = false;

  // He añadido 'private' a _config para que TypeScript lo reconozca como propiedad
  constructor(
    private datosPortafolio: PortafolioService,
    private _config: NgbCarouselConfig 
  ) { 
    // Ejemplo de uso de config (opcional)
    _config.interval = 5000;
    _config.wrap = true;
    _config.keyboard = false;
    _config.pauseOnHover = false;
  }

  ngOnInit(): void {
    this.datosPortafolio.CargarCapacitaciones().subscribe(resp => {
      this.capacitaciones = resp;
    });

    this.datosPortafolio.TituloCapacitaciones().subscribe(resp => {
      this.titcapacitaciones = resp;
    });
  }

  IsEmptyLeftT(): boolean {
    return this.EmptyLeftT;
  }

  SwEmptyLeftT(): boolean {
    this.EmptyLeftT = !this.EmptyLeftT;
    return false;
  }
}