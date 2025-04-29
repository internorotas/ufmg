import { LinhaItem } from "../interfaces/linha";

export const linhasMock: LinhaItem[] = [
  {
    codigo: 5402,
    nome: "Santa Efigênia/Savassi",
    tipo: "Ônibus",
    sublinha: "Convencional",
    horarios: ["05:00", "05:40", "06:20", "17:00", "18:30", "22:00"],
    itinerario: [
      "Terminal Santa Efigênia", 
      "Av. Contorno", 
      "Praça Sete", 
      "Av. Getúlio Vargas", 
      "Savassi"
    ]
  },
  {
    codigo: 9401,
    nome: "BRT Move - Antônio Carlos",
    tipo: "BRT",
    sublinha: "Expresso",
    horarios: ["04:30", "05:15", "06:00", "19:00", "21:00", "23:30"],
    itinerario: [
      "Terminal Bandeira", 
      "Estação São Gabriel", 
      "Av. Antônio Carlos", 
      "Pampulha"
    ]
  },
  {
    codigo: 5100,
    nome: "Metrô Linha 1",
    tipo: "Metrô",
    sublinha: null,
    horarios: ["05:00", "05:15", "05:30", "23:00", "23:30"],
    itinerario: [
      "Estaçao Vilarinho", 
      "Estaçao Central", 
      "Estaçao Gameleira", 
      "Estaçao Eldorado"
    ]
  },
  {
    codigo: 2102,
    nome: "Circular Centro",
    tipo: "Ônibus",
    sublinha: "Circular Noturno",
    horarios: ["18:00", "19:30", "21:00", "23:00", "00:30"],
    itinerario: [
      "Praça da Estação", 
      "Av. Amazonas", 
      "Praça Sete", 
      "Mercado Central", 
      "Praça da Liberdade"
    ]
  }
];