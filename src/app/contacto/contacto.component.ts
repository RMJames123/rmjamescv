import { Component, OnInit, ChangeDetectorRef, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { PortafolioService } from '../servicios/portafolio.service';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

@Component({
  selector: 'app-contacto',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit {
  // Inyecciones modernas
  private datosPortafolio = inject(PortafolioService);
  private cdRef = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  contacto: any[] = [];
  titcontacto: any[] = [];

  constructor() {}

  ngOnInit(): void {
    // Aplicamos el contexto de inyección seguro para Firebase
    runInInjectionContext(this.injector, () => {
      this.cargarDatosContacto();
    });
  }

  private cargarDatosContacto(): void {
    // 1. Cargar datos de contacto (redes sociales, links, etc.)
    this.datosPortafolio.CargarContacto().subscribe({
      next: (resp) => {
        this.contacto = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error("Error cargando contacto:", err)
    });

    // 2. Cargar títulos dinámicos
    this.datosPortafolio.TituloContacto().subscribe({
      next: (resp) => {
        this.titcontacto = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error("Error cargando títulos contacto:", err)
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
      // EmailJS funciona fuera de Firebase, no necesita runInInjectionContext
      emailjs.sendForm('SendEmailHot', 'template_erg8wvo', e.target as HTMLFormElement, 'P4lgFglXabNxfC758')
        .then((result: EmailJSResponseStatus) => {
          alert("✅ ¡Email enviado con éxito!");
          form?.reset();
        }, (error) => {
          alert("❌ Error al enviar: " + error.text);
        });
    } else {
      alert("⚠️ " + msgerror);
    }
  }
}