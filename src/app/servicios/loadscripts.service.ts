import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadscriptsService {

  constructor() { }

  /**
   * Carga scripts dinámicamente desde la carpeta assets.
   * @param archivos Arreglo con los nombres de los archivos (sin extensión .js)
   */
  Carga(archivos: string[]) {
    for (const archivo of archivos) {
      const id = `script-${archivo}`;
      
      // Verificamos si el script ya fue inyectado para no duplicarlo
      if (!document.getElementById(id)) {
        const script = document.createElement("script");
        script.src = `./assets/js/${archivo}.js`;
        script.id = id; // Le asignamos un ID para controlarlo
        script.defer = true;
        
        const body = document.getElementsByTagName("body")[0];
        body.appendChild(script);
        
        // Log opcional para debug en consola
        console.log(`Script cargado: ${archivo}.js`);
      }
    }
  }
}