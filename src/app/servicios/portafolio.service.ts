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
    const experiencias = (res.experiencia || []).filter((item: any) => item.Idioma === this.Idioma);
    const fotoUrl = res.foto && res.foto[0] ? res.foto[0].Archivo : null;

    const COL1_W = 165; 
    const COL2_X = 185; 
    const COL3_X = 350; 
    const WIDTH_COL3 = pageWidth - COL3_X - 30;
    const cAzul = [60, 94, 150];
    const cOcre = [184, 134, 11];
    const cGris = [100, 100, 100];

    const dibujarSidebar = () => {
      doc.setFillColor(cAzul[0], cAzul[1], cAzul[2]);
      doc.rect(0, 0, COL1_W, pageHeight, 'F');
    };

    // PÁGINA 1
    dibujarSidebar();

    if (fotoUrl) {
      try {
        const imgData = await this.getBase64ImageFromURL(fotoUrl);
        doc.addImage(imgData, 'JPEG', 17, 30, 130, 160);
      } catch (e) { console.error("Error foto"); }
    }

    // Sobre Mí (Sidebar)
    doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(this.Idioma === 'English' ? "ABOUT ME" : "SOBRE MÍ", 20, 215);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const sobreMiLines: string[] = doc.splitTextToSize(p.sobreMi || p.Descripcion || '', 125);
    let ySide = 235;
    sobreMiLines.forEach((line: string) => { 
      if(ySide < pageHeight - 40) { doc.text(line, 20, ySide, {align:'justify'}); ySide += 12; }
    });

    // Header (Nombre y Título)
    doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    const nomLines: string[] = doc.splitTextToSize((p.nombre || '').toUpperCase(), 200);
    doc.text(nomLines, COL2_X, 60);
    let yH = 65 + (nomLines.length * 18);
    doc.setTextColor(cGris[0], cGris[1], cGris[2]);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    const funcLines: string[] = doc.splitTextToSize(p.funcion || '', 200);
    doc.text(funcLines, COL2_X, yH);
    yH += (funcLines.length * 14) + 5;
    doc.setFont("helvetica", "bold"); doc.text(p.titulo || '', COL2_X, yH);

    // Contacto
    let yC = 55;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const dL: string[] = doc.splitTextToSize(p.direccion || '', WIDTH_COL3);
    doc.text(dL, pageWidth - 30, yC, { align: 'right' });
    yC += (dL.length * 12) + 5;
    doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
    doc.text(p.telefono || '', pageWidth - 30, yC, { align: 'right' });
    yC += 15;
    doc.setTextColor(cAzul[0], cAzul[1], cAzul[2]);
    doc.text(p.email || '', pageWidth - 30, yC, { align: 'right' });

    // EXPERIENCIA
    let currentY = 185;
    doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(this.Idioma === 'English' ? "WORK EXPERIENCE" : "EXPERIENCIA LABORAL", COL2_X, currentY - 8);
    doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]); doc.setLineWidth(1.5);
    doc.line(COL2_X, currentY, pageWidth - 30, currentY);

    currentY += 20; // Espacio inicial reducido

    experiencias.forEach((exp: any, index: number) => {
      // Solo saltamos si no queda espacio ni para el nombre de la empresa
      if (currentY > pageHeight - 50) {
        doc.addPage(); dibujarSidebar(); currentY = 50;
      }

      const rowY = currentY;

      // Empresa y Fecha
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      const linesEmp: string[] = doc.splitTextToSize((exp.Empresa || '').toUpperCase(), 150);
      doc.text(linesEmp, COL2_X, rowY);
      let yL = rowY + (linesEmp.length * 11);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
      doc.text(exp.Fecha || '', COL2_X, yL);
      yL += 11;

      // Cargo
      let yR = rowY;
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
      const linesCargo: string[] = doc.splitTextToSize(exp.Cargo || '', WIDTH_COL3);
      doc.text(linesCargo, COL3_X, yR);
      yR += (linesCargo.length * 13);

      // Asignación y Ubicación
      if (exp.Ubicacion && exp.Ubicacion.trim() !== "") {
        if (exp.Asignacion && exp.Asignacion.trim() !== "") {
          doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
          const etiq = this.Idioma === 'English' ? "Assignment: " : "Asignación: ";
          doc.text(etiq, COL3_X, yR);
          const off = doc.getTextWidth(etiq);
          doc.setFont("helvetica", "normal"); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
          const aT: string[] = doc.splitTextToSize(exp.Asignacion, WIDTH_COL3 - off);
          doc.text(aT, COL3_X + off, yR);
          yR += (aT.length * 11) + 2;
        }
        doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
        const uT: string[] = doc.splitTextToSize(exp.Ubicacion, WIDTH_COL3);
        doc.text(uT, COL3_X, yR);
        yR += (uT.length * 11) + 5;
      }

      // Logros
      doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      doc.text(this.Idioma === 'English' ? "Key Achievements:" : "Logros:", COL3_X, yR);
      yR += 12;

      const logros = exp.Logros || [];
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      logros.forEach((log: any) => {
        const dLog: string[] = doc.splitTextToSize(log.Descripcion || '', WIDTH_COL3 - 15);
        const hLog = (dLog.length * 10.5) + 3;

        // SALTO INDIVIDUAL POR LOGRO
        if (yR + hLog > pageHeight - 35) {
          doc.addPage(); dibujarSidebar(); yR = 50;
          doc.setFontSize(8); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
          doc.text(`(${exp.Empresa} - cont.)`, COL3_X, yR - 10);
          doc.setFontSize(9); doc.setTextColor(0, 0, 0);
        }
        doc.text("•", COL3_X + 5, yR);
        doc.text(dLog, COL3_X + 15, yR);
        yR += hLog;
      });

      // Calculamos el final de esta experiencia
      currentY = Math.max(yL, yR) + 8; // Margen entre empresas reducido
      
      // Línea divisoria ocre
      if (index < experiencias.length - 1) {
        // Si la línea va a quedar huérfana al final, saltamos página
        if (currentY > pageHeight - 30) { doc.addPage(); dibujarSidebar(); currentY = 50; }
        doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]); doc.setLineWidth(0.5);
        doc.line(COL2_X, currentY, pageWidth - 30, currentY);
        currentY += 12; // Espacio post-línea reducido
      }
    });

    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');

  } catch (error) { console.error("Error PDF:", error); }
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