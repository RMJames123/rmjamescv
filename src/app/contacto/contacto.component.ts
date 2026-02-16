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
  // Inyecciones modernas de Angular 17+
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
    // 1. Cargar datos de contacto (Ubicación, Emails de texto, Botones)
    this.datosPortafolio.CargarContacto().subscribe({
      next: (resp) => {
        // Aseguramos que sea un Array para evitar errores de iteración
        this.contacto = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error("Error cargando contacto:", err)
    });

    // 2. Cargar títulos dinámicos de la sección
    this.datosPortafolio.TituloContacto().subscribe({
      next: (resp) => {
        this.titcontacto = Array.isArray(resp) ? resp : Object.values(resp);
        this.cdRef.detectChanges();
      },
      error: (err) => console.error("Error cargando títulos contacto:", err)
    });
  }

  public sendEmail(e: Event): void {
    // 1. Prevenir la recarga de la página inmediatamente
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    
    // Obtenemos los valores para validar
    const name = (form.querySelector('#name') as HTMLInputElement)?.value;
    const email = (form.querySelector('#email') as HTMLInputElement)?.value;
    const message = (form.querySelector('#message') as HTMLTextAreaElement)?.value;

    // 2. Validación Robusta
    if (!name || name.trim() === "") {
      alert("⚠️ Por favor, ingrese su nombre.");
      return;
    }

    const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!email || !EMAIL_REGEX.test(email)) {
      alert("⚠️ Por favor, ingrese un email válido.");
      return;
    }

    if (!message || message.trim() === "") {
      alert("⚠️ El mensaje no puede estar vacío.");
      return;
    }

    // 3. Envío mediante EmailJS
    // Importante: Los IDs deben ser exactos a los de tu cuenta de EmailJS
    const SERVICE_ID = 'SendEmailHot';
    const TEMPLATE_ID = 'template_erg8wvo';
    const PUBLIC_KEY = 'P4lgFglXabNxfC758';

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY)
      .then((result: EmailJSResponseStatus) => {
        console.log('✅ Éxito:', result.text);
        alert("✅ ¡Mensaje enviado con éxito! Me pondré en contacto pronto.");
        form.reset(); // Limpia el formulario tras el éxito
      })
      .catch((error) => {
        console.error("❌ Error de EmailJS:", error);
        // El error 412 suele detallarse aquí
        alert(`❌ Error al enviar: ${error.text || 'Error de precondición'}. Verifique la consola.`);
      });
  }
}