// Fichas técnicas extraídas do cronograma do Polo (PRODUÇÃO E GRAMATURAS).
// gramatura = gramas por porção; preparações "(lote)" usam gramas por lote produzido.
export const FICHAS_INICIAIS = [
  // BOVINOS
  { id: 'f01', materiaPrima: 'Carne de Sol (Colchão Mole)', preparacao: 'Cozido em cubos (Arrumadinho / Sol na Nata)', gramatura: 100 },
  { id: 'f02', materiaPrima: 'Carne de Sol (Colchão Mole)', preparacao: 'Desfiado — Refeição', gramatura: 150 },
  { id: 'f03', materiaPrima: 'Carne de Sol (Colchão Mole)', preparacao: 'Desfiado — Petisco', gramatura: 300 },
  { id: 'f04', materiaPrima: 'Filé Mignon', preparacao: 'Parmegiana', gramatura: 130 },
  { id: 'f05', materiaPrima: 'Filé Mignon', preparacao: 'Filé ao Molho (Madeira / Gorgonzola)', gramatura: 150 },
  { id: 'f06', materiaPrima: 'Filé Mignon', preparacao: 'Strogonoff (lote)', gramatura: 1500 },
  { id: 'f07', materiaPrima: 'Filé Mignon', preparacao: 'Filé com Fritas', gramatura: 300 },
  { id: 'f08', materiaPrima: 'Filé Mignon', preparacao: 'Carne Yakisoba', gramatura: 70 },
  { id: 'f09', materiaPrima: 'Charque', preparacao: 'Escondidinho / Arrumadinho', gramatura: 100 },
  { id: 'f10', materiaPrima: 'Charque', preparacao: 'Caldinho de Feijão (lote)', gramatura: 500 },
  { id: 'f11', materiaPrima: 'Charque', preparacao: 'Caldinho Moda da Casa (lote)', gramatura: 500 },
  { id: 'f12', materiaPrima: 'Cupim', preparacao: 'Cupim Cozido ao Molho Madeira', gramatura: 150 },
  { id: 'f13', materiaPrima: 'Maminha', preparacao: 'Refeição', gramatura: 150 },
  { id: 'f14', materiaPrima: 'Picanha', preparacao: 'Refeição Executivo', gramatura: 150 },
  // AVES
  { id: 'f15', materiaPrima: 'Frango Filé', preparacao: 'Parmegiana / Frango Grelhado', gramatura: 150 },
  { id: 'f16', materiaPrima: 'Frango Filé', preparacao: 'Petisco em Cubos', gramatura: 300 },
  { id: 'f17', materiaPrima: 'Frango Filé', preparacao: 'Strogonoff (lote)', gramatura: 2000 },
  { id: 'f18', materiaPrima: 'Frango Filé', preparacao: 'Medalhão de Frango', gramatura: 150 },
  { id: 'f19', materiaPrima: 'Frango Filé', preparacao: 'Salada Caesar', gramatura: 100 },
  { id: 'f20', materiaPrima: 'Frango Filé', preparacao: 'Yakisoba', gramatura: 70 },
  // FRUTOS DO MAR
  { id: 'f21', materiaPrima: 'Tilápia Filé', preparacao: 'Filé Refeição (1 filé ≈ 200 g)', gramatura: 200 },
  { id: 'f22', materiaPrima: 'Bacalhau', preparacao: 'Bacalhau Cremoso — Refeição', gramatura: 100 },
  { id: 'f23', materiaPrima: 'Salmão', preparacao: 'Salmão Refeição', gramatura: 150 },
  { id: 'f24', materiaPrima: 'Camarão', preparacao: 'Três Queijos — Refeição', gramatura: 100 },
  { id: 'f25', materiaPrima: 'Camarão', preparacao: 'Empanado — Petisco', gramatura: 50 },
  { id: 'f26', materiaPrima: 'Camarão', preparacao: 'Alho e Óleo — Petisco', gramatura: 300 },
  { id: 'f27', materiaPrima: 'Camarão', preparacao: 'Salada do Polo', gramatura: 100 },
  { id: 'f28', materiaPrima: 'Camarão', preparacao: 'Yakisoba Especial', gramatura: 70 },
  // SUÍNOS
  { id: 'f29', materiaPrima: 'Picanha Suína', preparacao: 'Refeição', gramatura: 150 },
  { id: 'f30', materiaPrima: 'Costela Suína Barbecue', preparacao: 'Refeição', gramatura: 150 },
  { id: 'f31', materiaPrima: 'Costela Suína Barbecue', preparacao: 'Petisco', gramatura: 600 },
  // CAPRINOS
  { id: 'f32', materiaPrima: 'Bode', preparacao: 'Refeição', gramatura: 150 },
  { id: 'f33', materiaPrima: 'Bode', preparacao: 'Petisco em Cubos', gramatura: 300 },
  // CONGELADOS / DIVERSOS
  { id: 'f34', materiaPrima: 'Batata Frita', preparacao: 'Refeição (acompanhamento)', gramatura: 70 },
  { id: 'f35', materiaPrima: 'Batata Frita', preparacao: 'Petisco / Petisco Gourmet', gramatura: 300 },
  { id: 'f36', materiaPrima: 'Macaxeira', preparacao: 'Escondidinho', gramatura: 150 },
  { id: 'f37', materiaPrima: 'Macaxeira', preparacao: 'Caldinhos (lote)', gramatura: 2000 },
  { id: 'f38', materiaPrima: 'Tripa', preparacao: 'Petisco', gramatura: 300 },
  { id: 'f39', materiaPrima: 'Calabresa', preparacao: 'Petisco', gramatura: 300 },
  { id: 'f40', materiaPrima: 'Calabresa', preparacao: 'Arrumadinho / Feijão Tropeiro (lote)', gramatura: 1000 },
  { id: 'f41', materiaPrima: 'Fígado Bovino', preparacao: 'Fígado Petisco', gramatura: 300 },
  // FRIOS
  { id: 'f42', materiaPrima: 'Mussarela', preparacao: 'Parmegiana Executivo (1 kg ≈ 25 porções)', gramatura: 40 },
  { id: 'f43', materiaPrima: 'Mussarela', preparacao: 'Pastel de Queijo', gramatura: 25 },
  { id: 'f44', materiaPrima: 'Queijo Coalho', preparacao: 'Arrumadinho / Carne de Sol Desfiada', gramatura: 80 },
];
