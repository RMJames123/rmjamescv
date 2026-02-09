import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para los *ngFor del carrusel de testimonios
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-testimonios',
  standalone: true, // Actualizado a Angular 21
  imports: [CommonModule], // Habilita las directivas para el template
  templateUrl: './testimonios.component.html',
  styleUrls: ['./testimonios.component.css']
})
export class TestimoniosComponent implements OnInit {

  testimonio: any[] = [];
  tittestimonio: any[] = [];

  constructor(private datosPortafolio: PortafolioService) { }

  ngOnInit(): void {
    this.datosPortafolio.CargarTestimonios().subscribe(resp => {
      this.testimonio = resp;
    });

    this.datosPortafolio.TituloTestimonios().subscribe(resp => {
      this.tittestimonio = resp;
    });
  }

}