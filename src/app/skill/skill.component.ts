import { Component, OnInit, ChangeDetectorRef, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-skill',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.css']
})
export class SkillComponent implements OnInit {
  // Inyecciones mediante la función inject()
  private datosPortafolio = inject(PortafolioService);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  skill: any[] = [];
  titskill: any[] = [];

  constructor() { }

  ngOnInit(): void {
    // Envolvemos la carga en el contexto de inyección para blindar la conexión con Firebase
    runInInjectionContext(this.injector, () => {
      this.cargarDatosSkills();
    });
  }

  private cargarDatosSkills(): void {
    // 1. Cargar el listado de habilidades (SAP, Angular, SQL, etc.)
    this.datosPortafolio.CargarSkill().subscribe({
      next: (resp) => {
        console.log("✅ Skills recibidas:", resp);
        // Aseguramos formato array y ordenamos por nivel o nombre si es necesario
        this.skill = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error al obtener skills:', err)
    });

    // 2. Cargar el título dinámico de la sección
    this.datosPortafolio.TituloSkill().subscribe({
      next: (resp) => {
        this.titskill = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error('Error al obtener título de skills:', err)
    });
  }
}