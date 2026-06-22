import L from 'leaflet';

// leaflet-rotate é um plugin UMD que usa L como global (window.L).
// Atribuir aqui antes do import garante que o UMD encontre o namespace.
(window as unknown as Record<string, unknown>).L = L;

// Importa o build UMD diretamente (dist) em vez da source ESM (src/index.js).
// O UMD executa imediatamente e patcheia L.Map via window.L. A source ESM
// referencia L como global livre e pode falhar em contextos ESM estritos do Vite.
import 'leaflet-rotate/dist/leaflet-rotate.js';

// react-leaflet v5 MapContainer destrutura props conhecidas e passa o resto
// como opções para L.Map(). Porém, o plugin leaflet-rotate precisa de
// rotate=true no construtor para criar o rotatePane correto em _initPanes.
//保险: garante que rotate=true mesmo que a prop não chegue ao construtor.
L.Map.mergeOptions({ rotate: true });
