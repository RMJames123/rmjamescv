import { Component, OnInit, ChangeDetectorRef, inject, runInInjectionContext, Injector } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  perfil: any[] = [];
  urlFotoPerfil: string = 'assets/img/Mi Foto.png'; 

  // Inyectamos el inyector global para asegurar el contexto
  private injector = inject(Injector);
  private cd = inject(ChangeDetectorRef);
  private datosPortafolio = inject(PortafolioService);

  constructor() { }

  ngOnInit(): void {
    // Envolvemos las llamadas para asegurar que NgZone y Firebase tengan contexto
    runInInjectionContext(this.injector, () => {
      this.cargarDatosTexto();
      this.cargarImagenPerfil();
    });
  }

  descargarCV() {
    this.datosPortafolio.generarPDF();
  } 

  private cargarDatosTexto(): void {
    this.datosPortafolio.CargarPerfil().subscribe({
      next: (resp) => {
        console.log("Perfil OK:", resp);
        this.perfil = resp;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error Perfil:", err)
    });
  }

  private cargarImagenPerfil(): void {
    this.datosPortafolio.CargarFoto().subscribe({
      next: (resp) => {
        console.log("Foto OK:", resp);
        if (resp && resp.length > 0) {
          this.urlFotoPerfil = resp[0].Archivo;   
          this.cd.detectChanges();
        }
      },
      error: (err) => console.error("Error Foto:", err)
    });
  }
}