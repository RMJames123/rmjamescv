import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para solucionar los avisos NG8103 (*ngFor)
import { PortafolioService } from '../servicios/portafolio.service';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

@Component({
  selector: 'app-contacto',
  standalone: true, // Habilitado para compatibilidad con Angular 21
  imports: [CommonModule], // Importamos CommonModule para habilitar las directivas básicas
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit {

  contacto: any[] = [];
  titcontacto: any[] = [];

  constructor(private datosPortafolio: PortafolioService) {}

  ngOnInit(): void {
    this.datosPortafolio.CargarContacto().subscribe(resp => {
      this.contacto = resp;
    });

    this.datosPortafolio.TituloContacto().subscribe(resp => {
      this.titcontacto = resp;
    });
  }

  public sendEmail(e: Event) {
    const name = document.getElementById('name') as HTMLInputElement | null;
    const email = document.getElementById('email') as HTMLInputElement | null;
    const message = document.getElementById('message') as HTMLInputElement | null;
    const form = document.getElementById('frmContacto') as HTMLFormElement | null;
    
    let msgerror: string = "";
    const EMAIL_CHAR = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (!name?.value) {
      msgerror = "Ingrese un nombre";
    }

    if (msgerror === "") {
      if (!email?.value) {
        msgerror = "Ingrese un email";
      } else {
        let strEmail = email?.value;
        if (!strEmail?.match(EMAIL_CHAR)) {
          msgerror = "Email no válido";
        }
      }
    }

    if (msgerror === "" && !message?.value) {
      msgerror = "Ingrese un mensaje";
    }

    if (msgerror === "") {
      e.preventDefault();
      emailjs.sendForm('SendEmailHot', 'template_erg8wvo', e.target as HTMLFormElement, 'P4lgFglXabNxfC758')
        .then((result: EmailJSResponseStatus) => {
          alert("Email enviado!!!");
          form?.reset();
        }, (error) => {
          alert(error.text);
        });
    } else {
      alert(msgerror);
    }
  }
}