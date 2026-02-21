import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core'; // Añadimos Injector y runInInjectionContext
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { take, catchError, map, first } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LanguageService } from './language.service';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {
  private http = inject(HttpClient);
  private dbPortfolio = inject(AngularFireDatabase);
  private LangService = inject(LanguageService);
  private injector = inject(Injector); // Necesario para mantener el contexto vivo

  constructor() { }

  get Idioma(): string {
    return this.LangService.sIdioma || 'es';
  }

  // --- MÉTODOS DE CARGA (Para que la web no falle) ---
  private getData(path: string): Observable<any[]> {
    return this.dbPortfolio.list(path).valueChanges().pipe(
      map((items: any[]) => items ? items.filter(item => item && item.Idioma === this.Idioma) : []),
      catchError(err => { console.error(err); return of([]); })
    );
  }

  CargarPerfil(): Observable<any> { return this.getData('/Perfil'); }
  CargarFoto(): Observable<any> { return this.dbPortfolio.list('/Foto').valueChanges(); }
  CargarIdiomas(): Observable<any> { return this.http.get('https://rm-portafolio-default-rtdb.firebaseio.com/Idiomas.json'); }
  CargarMenu(): Observable<any> { return this.getData('/Menu'); }
  CargarSkill(): Observable<any> { return this.getData('/Skill'); }
  CargarExperiencia(): Observable<any> { return this.getData('/Experiencia'); }
  CargarEducacion(): Observable<any> { return this.getData('/Educacion'); }
  CargarCapacitaciones(): Observable<any> { return this.getData('/Capacitaciones'); }
  CargarTestimonios(): Observable<any> { return this.getData('/Testimonios'); }
  CargarContacto(): Observable<any> { return this.getData('/Contacto'); }
  CargarIconos(): Observable<any> { return this.dbPortfolio.list('/Iconos').valueChanges(); }

  private getMenuByBtnLang(btnLangKey: string): Observable<any> {
    const strBtnLang = `#${btnLangKey}_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu').valueChanges().pipe(
      map((menu: any[]) => (menu || []).filter(m => m.BtnLang === strBtnLang))
    );
  }

  TituloSkill(): Observable<any> { return this.getMenuByBtnLang('skills'); }
  TituloExperiencia(): Observable<any> { return this.getMenuByBtnLang('experience'); }
  TituloCapacitaciones(): Observable<any> { return this.getMenuByBtnLang('trainings'); }
  TituloTestimonios(): Observable<any> { return this.getMenuByBtnLang('testimonials'); }
  TituloContacto(): Observable<any> { return this.getMenuByBtnLang('contact'); }
  TituloEducacion(): Observable<any> { return this.getMenuByBtnLang('education'); }

  // --- GENERACIÓN DE CV (SOLUCIÓN DEFINITIVA NG0203) ---
  generarPDF() {
    Swal.fire({
      title: 'Generando CV...',
      text: 'Recuperando contexto de seguridad...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    // Esta es la clave: obligamos a ejecutar la carga en el contexto original del servicio
    runInInjectionContext(this.injector, () => {
      
      const perfilObs = this.dbPortfolio.list('/Perfil').valueChanges().pipe(first());
      const fotoObs = this.dbPortfolio.list('/Foto').valueChanges().pipe(first());
      const experienciaObs = this.dbPortfolio.list('/Experiencia').valueChanges().pipe(first());
      forkJoin({
        perfil: perfilObs,
        foto: fotoObs,
        experiencia: experienciaObs
      }).subscribe({
        next: (res: any) => {
          this.procesarDocumento(res);
        },
        error: (err) => {
          console.error("Error en flujo:", err);
          Swal.fire('Error', 'Fallo de conexión con Firebase', 'error');
        }
      });
    });
  }

private async procesarDocumento(res: any) {
  try {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const p = (res.perfil || []).find((item: any) => item.Idioma === this.Idioma) || {};
    const experiencias = res.experiencia || [];
    const fotoUrl = res.foto && res.foto[0] ? res.foto[0].Archivo : null;

    // --- BLOQUE DE COORDENADAS FIJAS (ESTRUCTURA DE 3 COLUMNAS) ---
    const COL1_W = 165; 
    const COL2_X = 185; const COL2_W = 180; 
    const COL3_X = 350; // Ajustado para que Cargo tenga buen espacio
    const WIDTH_COL3 = pageWidth - COL3_X - 30;

    const cAzul = [60, 94, 150];
    const cOcre = [184, 134, 11];
    const cGris = [100, 100, 100];

    const dibujarSidebar = () => {
      doc.setFillColor(cAzul[0], cAzul[1], cAzul[2]);
      doc.rect(0, 0, COL1_W, pageHeight, 'F');
    };

    // --- PÁGINA 1 ---
    dibujarSidebar();

    // 1. COLUMNA 1: FOTO Y "SOBRE MÍ" (DESCRIPCIÓN)
    if (fotoUrl) {
      try {
        const imgData = await this.getBase64ImageFromURL(fotoUrl);
        doc.addImage(imgData, 'JPEG', 17, 30, 130, 160);
      } catch (e) { console.error("Error foto"); }
    }

    doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("SOBRE MÍ", 20, 215);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const sobreMiTexto = p.sobreMi || p.Descripcion || '';
    const sobreMiLines = doc.splitTextToSize(sobreMiTexto, 125);
    let ySobreMi = 235;
    sobreMiLines.forEach((line: string) => {
      if (ySobreMi < pageHeight - 40) {
        doc.text(line, 20, ySobreMi, { align: 'justify' });
        ySobreMi += 12;
      }
    });

    // 2. COLUMNA 2: CABECERA (FIJA)
    doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    const nombreLines = doc.splitTextToSize((p.nombre || '').toUpperCase(), 200);
    doc.text(nombreLines, COL2_X, 60);

    let yCol2Head = 65 + (nombreLines.length * 18);
    doc.setTextColor(cGris[0], cGris[1], cGris[2]);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    const funcionLines = doc.splitTextToSize(p.funcion || '', 200);
    doc.text(funcionLines, COL2_X, yCol2Head);
    yCol2Head += (funcionLines.length * 14) + 5;
    doc.setFont("helvetica", "bold");
    doc.text(p.titulo || 'Ingeniero Industrial', COL2_X, yCol2Head);

    // 3. COLUMNA 3: CONTACTO (FIJA)
    let yContact = 55;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.setTextColor(cGris[0], cGris[1], cGris[2]);
    const dirLines = doc.splitTextToSize(p.direccion || '', pageWidth - COL3_X - 30);
    doc.text(dirLines, pageWidth - 30, yContact, { align: 'right' });
    yContact += (dirLines.length * 12) + 5;
    doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.text(p.telefono || '', pageWidth - 30, yContact, { align: 'right' });
    yContact += 15;
    doc.setTextColor(cAzul[0], cAzul[1], cAzul[2]);
    doc.text(p.email || '', pageWidth - 30, yContact, { align: 'right' });

    // --- SECCIÓN: EXPERIENCIA LABORAL ---
    let currentY = 185;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text("EXPERIENCIA LABORAL", COL2_X, currentY - 8);
    doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.setLineWidth(1.5);
    doc.line(COL2_X, currentY, pageWidth - 30, currentY);

    currentY += 30;

    experiencias.forEach((exp: any, index: number) => {
      if (currentY > pageHeight - 80) {
        doc.addPage();
        dibujarSidebar();
        currentY = 50;
      }

      const rowY = currentY;

      // COLUMNA 2: EMPRESA
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      const empLines = doc.splitTextToSize((exp.Empresa || '').toUpperCase(), 150);
      doc.text(empLines, COL2_X, rowY);
      
      let yL = rowY + (empLines.length * 12);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.setTextColor(cGris[0], cGris[1], cGris[2]);
      doc.text(exp.Ubicacion || '', COL2_X, yL);
      yL += 12;
      doc.text(exp.Fecha || '', COL2_X, yL);

      // COLUMNA 3: CARGO Y LOGROS (Alineados al rowY de la empresa)
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      const cargoLines = doc.splitTextToSize(exp.Cargo || exp.Puesto || '', WIDTH_COL3);
      doc.text(cargoLines, COL3_X, rowY);
      
      let yR = rowY + (cargoLines.length * 14);

      if (exp.Asignacion) {
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text("Asignación:", COL3_X, yR);
        yR += 13;
        doc.setTextColor(cGris[0], cGris[1], cGris[2]);
        const asigLines = doc.splitTextToSize(exp.Asignacion, WIDTH_COL3);
        doc.text(asigLines, COL3_X, yR);
        yR += (asigLines.length * 12) + 5;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text("Logros:", COL3_X, yR);
      yR += 14;

      doc.setFont("helvetica", "normal");
      const logros = exp.Logros || [];
      logros.forEach((log: any) => {
        const lineasLogro = doc.splitTextToSize(log.Descripcion || '', WIDTH_COL3 - 15);
        if (yR + (lineasLogro.length * 11) > pageHeight - 50) {
          doc.addPage(); dibujarSidebar(); yR = 50;
        }
        doc.text("•", COL3_X + 5, yR);
        doc.text(lineasLogro, COL3_X + 15, yR);
        yR += (lineasLogro.length * 11) + 4;
      });

      // --- DIBUJO DE LA LÍNEA DIVISORIA (EXCEPTO EN EL ÚLTIMO REGISTRO) ---
      currentY = Math.max(yL, yR) + 15;
      
      if (index < experiencias.length - 1) {
        doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]);
        doc.setLineWidth(0.5); // Línea más delgada
        doc.line(COL2_X, currentY, pageWidth - 30, currentY);
        currentY += 20; // Espacio después de la línea
      }
    });

    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  } catch (error) {
    console.error("Error en PDF:", error);
  }
}

private async getBase64ImageFromURL(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}