import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para los *ngFor en el HTML
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-skill',
  standalone: true, // Habilitamos modo Standalone
  imports: [CommonModule], // Importamos CommonModule para habilitar directivas como *ngFor
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.css']
})
export class SkillComponent implements OnInit {

  skill: any[] = [];
  titskill: any[] = [];

  constructor(private datosFortafolio: PortafolioService) { }

  ngOnInit(): void {
    this.datosFortafolio.CargarSkill().subscribe(resp => {
      this.skill = resp;
    });

    this.datosFortafolio.TituloSkill().subscribe(resp => {
      this.titskill = resp;
    });
  }

}