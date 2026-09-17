import { GeographicPole } from '../types';

export interface CityGeographicData {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  zoom: number;
  region: string;
  population?: string;
  poles: GeographicPole[];
}

export const CITIES_GEOGRAPHIC_DATABASE: CityGeographicData[] = [
  {
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    lat: -23.561684,
    lng: -46.655981,
    zoom: 12,
    region: 'Sudeste',
    population: '12.4M',
    poles: [
      {
        id: 'sp_cgh',
        name: 'Aeroporto de Congonhas (CGH)',
        category: 'airport',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.6273,
        lng: -46.6565,
        address: 'Av. Washington Luís, s/n - Vila Congonhas',
        dailyEstimatedFootfall: 62000,
        recommendedAudience: 'Executivos, Viagens de Negócios e Turismo',
        description: 'Principal hub de tráfego aéreo corporativo da América Latina com altíssimo fluxo de passageiros premium.'
      },
      {
        id: 'sp_gru',
        name: 'Aeroporto Internacional de Guarulhos (GRU)',
        category: 'airport',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.4356,
        lng: -46.4731,
        address: 'Rod. Hélio Smidt, s/n - Cumbica, Guarulhos',
        dailyEstimatedFootfall: 115000,
        recommendedAudience: 'Passageiros Internacionais e Nacionais',
        description: 'Maior aeroporto do Brasil e América do Sul com tráfego 24/7 de táxis e carros de app.'
      },
      {
        id: 'sp_faria_lima',
        name: 'Pólo Financeiro Faria Lima & Itaim Bibi',
        category: 'financial',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5855,
        lng: -46.6815,
        address: 'Av. Brg. Faria Lima x R. Leopoldo Couto de Magalhães Jr.',
        dailyEstimatedFootfall: 95000,
        recommendedAudience: 'Fintechs, Fundos de Investimento, Bancos e Alta Renda',
        description: 'Coração financeiro do Brasil ("Wall Street Brasileira"), com máxima concentração de tomadores de decisão.'
      },
      {
        id: 'sp_paulista',
        name: 'Avenida Paulista & Jardins',
        category: 'financial',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5616,
        lng: -46.6559,
        address: 'Av. Paulista, 1578 - Bela Vista / Jardins',
        dailyEstimatedFootfall: 140000,
        recommendedAudience: 'Consumidores Classe A/B, Cultura, Turismo e Negócios',
        description: 'Cartão postal e principal eixo cultural e corporativo de São Paulo.'
      },
      {
        id: 'sp_berrini',
        name: 'Vila Olímpia, Berrini & Chucri Zaidan',
        category: 'financial',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5956,
        lng: -46.6908,
        address: 'Av. Eng. Luís Carlos Berrini, 1000 - Itaim Bibi',
        dailyEstimatedFootfall: 78000,
        recommendedAudience: 'Multinacionais de Tecnologia, Big Techs e Startups',
        description: 'Polo de tecnologia e inovação com grandes edifícios corporativos triple-A.'
      },
      {
        id: 'sp_shopping_iguatemi',
        name: 'Shopping Iguatemi & JK Iguatemi',
        category: 'shopping',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5786,
        lng: -46.6902,
        address: 'Av. Brg. Faria Lima, 2232 - Jardim Paulistano',
        dailyEstimatedFootfall: 52000,
        recommendedAudience: 'Mercado de Luxo, Grifes Internacionais e Alta Renda',
        description: 'Complexos comerciais de altíssimo padrão com público com maior poder aquisitivo do país.'
      },
      {
        id: 'sp_tiete',
        name: 'Terminal Rodoviário Tietê & Expo Center Norte',
        category: 'transit',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5161,
        lng: -46.6253,
        address: 'Av. Cruzeiro do Sul, 1800 - Santana',
        dailyEstimatedFootfall: 90000,
        recommendedAudience: 'Viajantes interestaduais e visitantes de feiras de negócios',
        description: 'Maior terminal rodoviário da América Latina e polo de grandes feiras internacionais.'
      },
      {
        id: 'sp_transamerica',
        name: 'São Paulo Expo & Transamerica Expo Center',
        category: 'convention',
        city: 'São Paulo',
        state: 'SP',
        lat: -23.6478,
        lng: -46.6331,
        address: 'Rodovia dos Imigrantes, km 1,5 - Jabaquara',
        dailyEstimatedFootfall: 45000,
        recommendedAudience: 'Congressistas, Expositoras e Visitantes B2B',
        description: 'Maior centro de convenções da América Latina com congressos internacionais semanais.'
      }
    ]
  },
  {
    city: 'Ribeirão Preto',
    state: 'SP',
    country: 'Brasil',
    lat: -21.1775,
    lng: -47.8103,
    zoom: 13,
    region: 'Interior SP (Capital do Agronegócio)',
    population: '720k',
    poles: [
      {
        id: 'rp_fiusa',
        name: 'Avenida Professor João Fiúsa & Jardim Botânico',
        category: 'financial',
        city: 'Ribeirão Preto',
        state: 'SP',
        lat: -21.2052,
        lng: -47.8095,
        address: 'Av. Prof. João Fiúsa, 1400 - Alto da Boa Vista',
        dailyEstimatedFootfall: 38000,
        recommendedAudience: 'Líderes do Agronegócio, Médicos, Executivos e Alta Renda',
        description: 'Área mais nobre e valorizada de Ribeirão Preto, polo de escritórios de agronegócio e consultórios.'
      },
      {
        id: 'rp_aeroporto',
        name: 'Aeroporto Estadual Dr. Leite Lopes (RAO)',
        category: 'airport',
        city: 'Ribeirão Preto',
        state: 'SP',
        lat: -21.1364,
        lng: -47.7744,
        address: 'Av. Thomaz Alberto Whately, s/n - Parque Ind. Tanquinho',
        dailyEstimatedFootfall: 12000,
        recommendedAudience: 'Produtores Rurais, Investidores e Executivos Agro',
        description: 'Aeroporto regional estratégico com voos diários para capitais e hubs do agronegócio.'
      },
      {
        id: 'rp_ribeiraoshopping',
        name: 'RibeirãoShopping & Centro Médico Multiplan',
        category: 'shopping',
        city: 'Ribeirão Preto',
        state: 'SP',
        lat: -21.2185,
        lng: -47.8282,
        address: 'Av. Cel. Fernando Ferreira Leite, 1540 - Jd. Califórnia',
        dailyEstimatedFootfall: 42000,
        recommendedAudience: 'Consumidores das 80 cidades da Região Metropolitana',
        description: 'Principal complexo de compras, gastronomia e saúde especializada do interior paulista.'
      },
      {
        id: 'rp_iguatemi',
        name: 'Shopping Iguatemi Ribeirão & Vila do Golfe',
        category: 'shopping',
        city: 'Ribeirão Preto',
        state: 'SP',
        lat: -21.2312,
        lng: -47.8228,
        address: 'Av. Luiz Eduardo Toledo Prado, 900 - Vila do Golfe',
        dailyEstimatedFootfall: 26000,
        recommendedAudience: 'Famílias Classe A, Moradores de Condomínios Fechados',
        description: 'Complexo de luxo na Zona Sul com cinema VIP, marcas globais e alta gastronomia.'
      },
      {
        id: 'rp_agrishow',
        name: 'Pólo Agrishow & Centro de Eventos Taiwan',
        category: 'convention',
        city: 'Ribeirão Preto',
        state: 'SP',
        lat: -21.2290,
        lng: -47.7460,
        address: 'Rodovia Prefeito Antônio Duarte Nogueira, Km 319',
        dailyEstimatedFootfall: 35000,
        recommendedAudience: 'Empresários do Agronegócio Global e Compradores de Maquinário',
        description: 'Sede da maior feira de tecnologia agrícola do mundo (Agrishow) e grandes convenções.'
      },
      {
        id: 'rp_centro_hospitais',
        name: 'Polo Médico Hospital das Clínicas & Centro',
        category: 'hospital',
        city: 'Ribeirão Preto',
        state: 'SP',
        lat: -21.1685,
        lng: -47.8520,
        address: 'Campus USP Ribeirão Preto / Av. Bandeirantes, 3900',
        dailyEstimatedFootfall: 30000,
        recommendedAudience: 'Médicos, Pacientes Especializados e Universitários USP',
        description: 'Maior polo de referência médica e universitária do interior do Brasil.'
      }
    ]
  },
  {
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brasil',
    lat: -22.906847,
    lng: -43.172896,
    zoom: 12,
    region: 'Sudeste',
    population: '6.7M',
    poles: [
      {
        id: 'rj_sdu',
        name: 'Aeroporto Santos Dumont (SDU)',
        category: 'airport',
        city: 'Rio de Janeiro',
        state: 'RJ',
        lat: -22.9105,
        lng: -43.1631,
        address: 'Praça Sen. Salgado Filho, s/n - Centro',
        dailyEstimatedFootfall: 48000,
        recommendedAudience: 'Ponte Aérea Rio-SP, Executivos e Turistas',
        description: 'Aeroporto central com vista para o Pão de Açúcar e fluxo constante na Ponte Aérea.'
      },
      {
        id: 'rj_gig',
        name: 'Aeroporto Internacional do Galeão (GIG)',
        category: 'airport',
        city: 'Rio de Janeiro',
        state: 'RJ',
        lat: -22.8089,
        lng: -43.2436,
        address: 'Av. Vinte de Janeiro, s/n - Ilha do Governador',
        dailyEstimatedFootfall: 42000,
        recommendedAudience: 'Passageiros Internacionais e Voos Conexão',
        description: 'Porta de entrada do turismo internacional no Rio de Janeiro.'
      },
      {
        id: 'rj_copacabana',
        name: 'Copacabana, Ipanema & Leblon (Zona Sul)',
        category: 'hotel',
        city: 'Rio de Janeiro',
        state: 'RJ',
        lat: -22.9711,
        lng: -43.1822,
        address: 'Av. Atlântica x Av. Vieira Souto - Zona Sul',
        dailyEstimatedFootfall: 120000,
        recommendedAudience: 'Turistas Globais, Moradores de Alta Renda e Hotelaria 5 Estrelas',
        description: 'Polo hoteleiro e turístico mais famoso do país com corrida contínua de passageiros em apps.'
      },
      {
        id: 'rj_barra',
        name: 'Barra da Tijuca, Jardim Oceânico & Riocentro',
        category: 'convention',
        city: 'Rio de Janeiro',
        state: 'RJ',
        lat: -23.0003,
        lng: -43.3659,
        address: 'Av. das Américas, 5000 - Barra da Tijuca',
        dailyEstimatedFootfall: 75000,
        recommendedAudience: 'Condomínios de Luxo, Shopping Centers e Feiras de Negócios',
        description: 'Eixo moderno com grandes shoppings (BarraShopping, VillageMall) e condomínios de alta densidade.'
      },
      {
        id: 'rj_centro_financeiro',
        name: 'Centro Financeiro Rio Branco & Porto Maravilha',
        category: 'financial',
        city: 'Rio de Janeiro',
        state: 'RJ',
        lat: -22.9035,
        lng: -43.1795,
        address: 'Av. Rio Branco x Boulevard Olímpico - Centro',
        dailyEstimatedFootfall: 85000,
        recommendedAudience: 'Setor de Petróleo & Gás, Advocacia, Órgãos Públicos e Telecom',
        description: 'Sede de grandes multinacionais de energia, escritórios jurídicos e museus do Porto Maravilha.'
      }
    ]
  },
  {
    city: 'Belo Horizonte',
    state: 'MG',
    country: 'Brasil',
    lat: -19.916681,
    lng: -43.934493,
    zoom: 13,
    region: 'Sudeste',
    population: '2.5M',
    poles: [
      {
        id: 'bh_cnf',
        name: 'Aeroporto Internacional de Confins (CNF)',
        category: 'airport',
        city: 'Belo Horizonte',
        state: 'MG',
        lat: -19.6341,
        lng: -43.9689,
        address: 'Rodovia LMG-800, Km 7,9 - Confins',
        dailyEstimatedFootfall: 35000,
        recommendedAudience: 'Empresários, Mineração, Tecnologia e Turismo',
        description: 'Hub aéreo central de Minas Gerais com conexões diárias interestaduais e internacionais.'
      },
      {
        id: 'bh_savassi',
        name: 'Savassi, Praça da Liberdade & Lourdes',
        category: 'financial',
        city: 'Belo Horizonte',
        state: 'MG',
        lat: -19.9388,
        lng: -43.9348,
        address: 'Praça Diogo de Vasconcelos - Savassi / Lourdes',
        dailyEstimatedFootfall: 68000,
        recommendedAudience: 'Alta Gastronomia, Moda, Startups e Vida Noturna',
        description: 'Região mais charmosa da capital mineira com gastronomia premiada e escritórios criativos.'
      },
      {
        id: 'bh_shopping',
        name: 'BH Shopping & Belvedere (Zona Sul)',
        category: 'shopping',
        city: 'Belo Horizonte',
        state: 'MG',
        lat: -19.9753,
        lng: -43.9458,
        address: 'Rodovia BR-356, 3049 - Belvedere',
        dailyEstimatedFootfall: 45000,
        recommendedAudience: 'Condomínios de Nova Lima e Alta Renda de BH',
        description: 'Polo comercial de alto poder aquisitivo que conecta BH aos condomínios nobres de Nova Lima.'
      },
      {
        id: 'bh_expominas',
        name: 'Expominas Centro de Convenções',
        category: 'convention',
        city: 'Belo Horizonte',
        state: 'MG',
        lat: -19.9332,
        lng: -43.9875,
        address: 'Av. Amazonas, 6030 - Gameleira',
        dailyEstimatedFootfall: 28000,
        recommendedAudience: 'Congressos Técnicos e Exposições Industriais',
        description: 'Principal centro de feiras comerciais e exposições de Minas Gerais.'
      }
    ]
  },
  {
    city: 'Curitiba',
    state: 'PR',
    country: 'Brasil',
    lat: -25.428954,
    lng: -49.267137,
    zoom: 13,
    region: 'Sul',
    population: '1.9M',
    poles: [
      {
        id: 'cwb_cwb',
        name: 'Aeroporto Internacional Afonso Pena (CWB)',
        category: 'airport',
        city: 'Curitiba',
        state: 'PR',
        lat: -25.5317,
        lng: -49.1761,
        address: 'Av. Rocha Pombo, s/n - Águas Belas, São José dos Pinhais',
        dailyEstimatedFootfall: 22000,
        recommendedAudience: 'Executivos da Indústria Automotiva e Negócios',
        description: 'Principal aeroporto do Paraná conectando polos automotivos e indústrias da Região Sul.'
      },
      {
        id: 'cwb_batel',
        name: 'Batel & Praça da Espanha (Eixo Nobre)',
        category: 'financial',
        city: 'Curitiba',
        state: 'PR',
        lat: -25.4432,
        lng: -49.2844,
        address: 'Av. do Batel, 1500 - Batel',
        dailyEstimatedFootfall: 55000,
        recommendedAudience: 'Classe A, Gastronomia Premium, Hotéis e Negócios',
        description: 'Bairro nobre de Curitiba com maior concentração de restaurantes de luxo e shoppings (Pátio Batel).'
      },
      {
        id: 'cwb_ecoville',
        name: 'Ecoville & ParkShopping Barigüi',
        category: 'shopping',
        city: 'Curitiba',
        state: 'PR',
        lat: -25.4385,
        lng: -49.3172,
        address: 'R. Prof. Pedro Viriato Parigot de Souza, 600 - Mossunguê',
        dailyEstimatedFootfall: 40000,
        recommendedAudience: 'Moradores de Alto Padrão e Famílias',
        description: 'Região de edifícios residenciais de luxo e um dos shoppings mais movimentados da cidade.'
      },
      {
        id: 'cwb_centro_civico',
        name: 'Centro Cívico & Museu Oscar Niemeyer (MON)',
        category: 'transit',
        city: 'Curitiba',
        state: 'PR',
        lat: -25.4103,
        lng: -49.2671,
        address: 'R. Mal. Hermes, 999 - Centro Cívico',
        dailyEstimatedFootfall: 32000,
        recommendedAudience: 'Servidores Públicos, Jurídico e Turistas Culturais',
        description: 'Sede do governo estadual, tribunais de justiça e polo cultural icônico.'
      }
    ]
  },
  {
    city: 'Brasília',
    state: 'DF',
    country: 'Brasil',
    lat: -15.797515,
    lng: -47.891887,
    zoom: 12,
    region: 'Centro-Oeste',
    population: '3.1M',
    poles: [
      {
        id: 'bsb_bsb',
        name: 'Aeroporto Internacional de Brasília (BSB)',
        category: 'airport',
        city: 'Brasília',
        state: 'DF',
        lat: -15.8697,
        lng: -47.9172,
        address: 'Lago Sul, Brasília - DF',
        dailyEstimatedFootfall: 45000,
        recommendedAudience: 'Políticos, Autoridades, Diplomatas e Negócios',
        description: 'Maior hub de conexões do Centro-Norte do Brasil com circulação ininterrupta de frotas executivas.'
      },
      {
        id: 'bsb_esplanada',
        name: 'Esplanada dos Ministérios & Congresso Nacional',
        category: 'financial',
        city: 'Brasília',
        state: 'DF',
        lat: -15.7975,
        lng: -47.8645,
        address: 'Eixo Monumental - Zona Cívico-Administrativa',
        dailyEstimatedFootfall: 80000,
        recommendedAudience: 'Setor Público, Advocacia, Associações e Relações Governamentais',
        description: 'Centro do poder político e governamental brasileiro com trânsito de milhares de motoristas diários.'
      },
      {
        id: 'bsb_setor_hoteleiro',
        name: 'Setor Hoteleiro Norte & Sul (SHN/SHS)',
        category: 'hotel',
        city: 'Brasília',
        state: 'DF',
        lat: -15.7925,
        lng: -47.8890,
        address: 'SHN / SHS - Asa Norte e Asa Sul',
        dailyEstimatedFootfall: 50000,
        recommendedAudience: 'Hóspedes de Negócios, Congressistas e Turistas',
        description: 'Complexo de hotéis e shoppings (Brasília Shopping, Pátio Brasil) no centro de Brasília.'
      },
      {
        id: 'bsb_lago_sul',
        name: 'Lago Sul, Pontão & Gilberto Salomão',
        category: 'nightlife',
        city: 'Brasília',
        state: 'DF',
        lat: -15.8347,
        lng: -47.8722,
        address: 'SHIS QL 10 - Pontão do Lago Sul',
        dailyEstimatedFootfall: 35000,
        recommendedAudience: 'Renda per capita mais alta do país, Embaixadas e Gastronomia',
        description: 'Região com a maior renda per capita do Brasil, polo de restaurantes à beira do Lago Paranoá.'
      }
    ]
  },
  {
    city: 'Campinas',
    state: 'SP',
    country: 'Brasil',
    lat: -22.909938,
    lng: -47.062633,
    zoom: 13,
    region: 'Interior SP (Polo Tecnológico)',
    population: '1.2M',
    poles: [
      {
        id: 'cps_vcp',
        name: 'Aeroporto Internacional de Viracopos (VCP)',
        category: 'airport',
        city: 'Campinas',
        state: 'SP',
        lat: -23.0074,
        lng: -47.1345,
        address: 'Rod. Santos Dumont, km 66 - Parque Viracopos',
        dailyEstimatedFootfall: 36000,
        recommendedAudience: 'Executivos da Indústria, Cargas e Passageiros Globais',
        description: 'Hub principal da Azul Linhas Aéreas e maior terminal de carga aérea da América Latina.'
      },
      {
        id: 'cps_cambui',
        name: 'Cambuí, Taquaral & Nova Campinas',
        category: 'financial',
        city: 'Campinas',
        state: 'SP',
        lat: -22.8988,
        lng: -47.0505,
        address: 'R. Cel. Silva Telles - Cambuí',
        dailyEstimatedFootfall: 48000,
        recommendedAudience: 'Classe A, Gastronomia Noturna e Negócios',
        description: 'Bairro nobre e polo gastronômico e empresarial mais tradicional de Campinas.'
      },
      {
        id: 'cps_iguatemi',
        name: 'Shopping Iguatemi Campinas & Galleria Shopping',
        category: 'shopping',
        city: 'Campinas',
        state: 'SP',
        lat: -22.8906,
        lng: -47.0272,
        address: 'Av. Iguatemi, 777 - Vila Brandina',
        dailyEstimatedFootfall: 42000,
        recommendedAudience: 'Famílias e Consumidores da Região Metropolitana',
        description: 'Maior e mais tradicional shopping center da Região Metropolitana de Campinas.'
      },
      {
        id: 'cps_unicamp',
        name: 'Polo Tecnológico Unicamp & Barão Geraldo',
        category: 'university',
        city: 'Campinas',
        state: 'SP',
        lat: -22.8184,
        lng: -47.0647,
        address: 'Cidade Universitária Zeferino Vaz - Barão Geraldo',
        dailyEstimatedFootfall: 35000,
        recommendedAudience: 'Pesquisadores, Startups, Universitários e Cientistas',
        description: 'Maior polo de patentes, universidades e centros de inovação tecnológica do país.'
      }
    ]
  },
  {
    city: 'Santos',
    state: 'SP',
    country: 'Brasil',
    lat: -23.960833,
    lng: -46.333889,
    zoom: 13,
    region: 'Baixada Santista',
    population: '430k',
    poles: [
      {
        id: 'san_porto',
        name: 'Porto de Santos & Terminal de Cruzeiros (Concais)',
        category: 'transit',
        city: 'Santos',
        state: 'SP',
        lat: -23.9535,
        lng: -46.3150,
        address: 'Av. Cândido Gafre, s/n - Docas',
        dailyEstimatedFootfall: 30000,
        recommendedAudience: 'Turistas de Cruzeiros, Operadores Logísticos e Exportadores',
        description: 'Maior complexo portuário da América Latina e principal porto de cruzeiros marítimos.'
      },
      {
        id: 'san_gonzaga',
        name: 'Gonzaga, Praiamar & Orla da Praia',
        category: 'shopping',
        city: 'Santos',
        state: 'SP',
        lat: -23.9665,
        lng: -46.3335,
        address: 'Praça da Independência - Gonzaga',
        dailyEstimatedFootfall: 45000,
        recommendedAudience: 'Moradores, Turistas de Praia e Comércio',
        description: 'Coração comercial e turístico de Santos com os principais hotéis e shoppings à beira-mar.'
      }
    ]
  },
  {
    city: 'Salvador',
    state: 'BA',
    country: 'Brasil',
    lat: -12.977749,
    lng: -38.501630,
    zoom: 13,
    region: 'Nordeste',
    population: '2.9M',
    poles: [
      {
        id: 'ssa_ssa',
        name: 'Aeroporto Internacional de Salvador (SSA)',
        category: 'airport',
        city: 'Salvador',
        state: 'BA',
        lat: -12.9086,
        lng: -38.3225,
        address: 'Praça Gago Coutinho, s/n - São Cristóvão',
        dailyEstimatedFootfall: 24000,
        recommendedAudience: 'Turistas do Nordeste, Carnaval e Negócios',
        description: 'Principal porta de entrada turística da Bahia com intenso fluxo para o Litoral Norte.'
      },
      {
        id: 'ssa_tancredo',
        name: 'Avenida Tancredo Neves & Shopping Salvador',
        category: 'financial',
        city: 'Salvador',
        state: 'BA',
        lat: -12.9818,
        lng: -38.4552,
        address: 'Av. Tancredo Neves, 2915 - Caminho das Árvores',
        dailyEstimatedFootfall: 60000,
        recommendedAudience: 'Polo Financeiro da Bahia e Compras de Alto Padrão',
        description: 'Centro financeiro e comercial de Salvador com torres empresariais e centros médicos.'
      },
      {
        id: 'ssa_barra',
        name: 'Barra, Farol & Rio Vermelho',
        category: 'nightlife',
        city: 'Salvador',
        state: 'BA',
        lat: -13.0101,
        lng: -38.5325,
        address: 'Largo do Farol da Barra - Barra',
        dailyEstimatedFootfall: 50000,
        recommendedAudience: 'Turistas, Boemia Gastronômica e Vida Noturna',
        description: 'Polo icônico do turismo histórico, pôr do sol e centro da vida noturna soteropolitana.'
      }
    ]
  },
  {
    city: 'Porto Alegre',
    state: 'RS',
    country: 'Brasil',
    lat: -30.034647,
    lng: -51.217658,
    zoom: 13,
    region: 'Sul',
    population: '1.4M',
    poles: [
      {
        id: 'poa_poa',
        name: 'Aeroporto Internacional Salgado Filho (POA)',
        category: 'airport',
        city: 'Porto Alegre',
        state: 'RS',
        lat: -29.9939,
        lng: -51.1711,
        address: 'Av. Severo Dullius, 90010 - São João',
        dailyEstimatedFootfall: 25000,
        recommendedAudience: 'Negócios no RS, Mercosul e Turismo para a Serra Gaúcha',
        description: 'Principal hub aéreo do Rio Grande do Sul e conexão para a Serra Gaúcha (Gramado/Canela).'
      },
      {
        id: 'poa_moinhos',
        name: 'Moinhos de Vento & Padre Chagas',
        category: 'financial',
        city: 'Porto Alegre',
        state: 'RS',
        lat: -30.0245,
        lng: -51.2005,
        address: 'R. Padre Chagas - Moinhos de Vento',
        dailyEstimatedFootfall: 42000,
        recommendedAudience: 'Alta Gastronomia, Moda e Escritórios Corporativos',
        description: 'Bairro nobre e tradicional de Porto Alegre com alta concentração de renda.'
      },
      {
        id: 'poa_iguatemi',
        name: 'Shopping Iguatemi Porto Alegre & Bourbon Country',
        category: 'shopping',
        city: 'Porto Alegre',
        state: 'RS',
        lat: -30.0270,
        lng: -51.1620,
        address: 'Av. João Wallig, 1800 - Passo d\'Areia',
        dailyEstimatedFootfall: 48000,
        recommendedAudience: 'Famílias e Consumidores da Zona Norte',
        description: 'Grande complexo de varejo, cinemas e eventos corporativos.'
      }
    ]
  },
  {
    city: 'Fortaleza',
    state: 'CE',
    country: 'Brasil',
    lat: -3.731862,
    lng: -38.526670,
    zoom: 13,
    region: 'Nordeste',
    population: '2.7M',
    poles: [
      {
        id: 'for_for',
        name: 'Aeroporto Internacional Pinto Martins (FOR)',
        category: 'airport',
        city: 'Fortaleza',
        state: 'CE',
        lat: -3.7763,
        lng: -38.5326,
        address: 'Av. Sen. Carlos Jereissati, 3000 - Serrinha',
        dailyEstimatedFootfall: 22000,
        recommendedAudience: 'Hub Aéreo Internacional Air France/KLM e Turismo Nordeste',
        description: 'Ponto estratégico de conexão para a Europa e praias do Ceará (Jericoacoara/Canoa Quebrada).'
      },
      {
        id: 'for_beira_mar',
        name: 'Avenida Beira Mar, Meireles & Aldeota',
        category: 'hotel',
        city: 'Fortaleza',
        state: 'CE',
        lat: -3.7258,
        lng: -38.4988,
        address: 'Av. Beira Mar - Meireles',
        dailyEstimatedFootfall: 70000,
        recommendedAudience: 'Turistas Nacionais e Internacionais, Alta Renda e Gastronomia',
        description: 'Orla mais movimentada do Nordeste com rede hoteleira 5 estrelas e feirinha de artesanato.'
      },
      {
        id: 'for_iguatemi',
        name: 'Shopping Iguatemi Bosque & Centro de Eventos do Ceará',
        category: 'convention',
        city: 'Fortaleza',
        state: 'CE',
        lat: -3.7667,
        lng: -38.4812,
        address: 'Av. Washington Soares, 85 - Edson Queiroz',
        dailyEstimatedFootfall: 55000,
        recommendedAudience: 'Congressos Médicos, Feiras Internacionais e Compras',
        description: 'Segundo maior centro de eventos da América Latina e principal shopping do Ceará.'
      }
    ]
  },
  {
    city: 'Goiânia',
    state: 'GO',
    country: 'Brasil',
    lat: -16.686891,
    lng: -49.264794,
    zoom: 13,
    region: 'Centro-Oeste',
    population: '1.5M',
    poles: [
      {
        id: 'gyn_gyn',
        name: 'Aeroporto Santa Genoveva (GYN)',
        category: 'airport',
        city: 'Goiânia',
        state: 'GO',
        lat: -16.6322,
        lng: -49.2215,
        address: 'Alameda 4 - Santa Genoveva',
        dailyEstimatedFootfall: 18000,
        recommendedAudience: 'Agronegócio do Centro-Oeste, Saúde e Música',
        description: 'Porta de entrada para o pujante agronegócio goiano.'
      },
      {
        id: 'gyn_marista',
        name: 'Setor Marista, Bueno & Parque Vaca Brava',
        category: 'financial',
        city: 'Goiânia',
        state: 'GO',
        lat: -16.7058,
        lng: -49.2672,
        address: 'Av. 136 x R. 9 - Setor Marista / Bueno',
        dailyEstimatedFootfall: 62000,
        recommendedAudience: 'Alta Renda, Gastronomia Sertaneja e Shopping Flamboyant',
        description: 'Área mais nobre e cosmopolita de Goiânia com bares e restaurantes conceituados.'
      }
    ]
  },
  {
    city: 'Florianópolis',
    state: 'SC',
    country: 'Brasil',
    lat: -27.595378,
    lng: -48.548050,
    zoom: 13,
    region: 'Sul',
    population: '530k',
    poles: [
      {
        id: 'fln_fln',
        name: 'Aeroporto Internacional Hercílio Luz (FLN - Zurich)',
        category: 'airport',
        city: 'Florianópolis',
        state: 'SC',
        lat: -27.6703,
        lng: -48.5525,
        address: 'Rod. Ac. ao Aeroporto, 6.200 - Carianos',
        dailyEstimatedFootfall: 20000,
        recommendedAudience: 'Tecnologia, Turismo Global e Executivos',
        description: 'Eleito repetidamente o melhor aeroporto do Brasil (Boulevard 14/32).'
      },
      {
        id: 'fln_beiramar',
        name: 'Avenida Beira-Mar Norte & Centro',
        category: 'financial',
        city: 'Florianópolis',
        state: 'SC',
        lat: -27.5855,
        lng: -48.5452,
        address: 'Av. Jorn. Rubens de Arruda Ramos - Centro',
        dailyEstimatedFootfall: 45000,
        recommendedAudience: 'Polo de Tecnologia (Ilha do Silício) e Alta Renda',
        description: 'Eixo corporativo nobre com vista para a Baía Norte.'
      },
      {
        id: 'fln_jurere',
        name: 'Jurerê Internacional & Polo Gastronômico',
        category: 'nightlife',
        city: 'Florianópolis',
        state: 'SC',
        lat: -27.4410,
        lng: -48.4988,
        address: 'Av. dos Búzios - Jurerê Internacional',
        dailyEstimatedFootfall: 30000,
        recommendedAudience: 'Turistas de Luxo, Beach Clubs e Festivais',
        description: 'Destino de luxo mundialmente famoso por beach clubs e mansões.'
      }
    ]
  }
];

const CUSTOM_CITIES_STORAGE_KEY = 'velo_custom_cities_registry_v1';

/**
 * Helper to get custom registered cities from localStorage safely
 */
export function getCustomCities(): CityGeographicData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CITIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading custom cities:', err);
    return [];
  }
}

/**
 * Save and register a new custom city in the system (available across all screens, maps, and selects)
 */
export function registerCustomCity(cityData: Partial<CityGeographicData> & { city: string; state: string; lat: number; lng: number }): CityGeographicData {
  const customCities = getCustomCities();
  
  // Default poles for a newly registered city if none provided
  const cityId = cityData.city.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const defaultPoles: GeographicPole[] = cityData.poles && cityData.poles.length > 0 ? cityData.poles : [
    {
      id: `${cityId}_centro`,
      name: `Centro Comercial & Financeiro de ${cityData.city}`,
      category: 'financial',
      city: cityData.city,
      state: cityData.state,
      lat: cityData.lat,
      lng: cityData.lng,
      address: `Região Central - ${cityData.city}, ${cityData.state}`,
      dailyEstimatedFootfall: 45000,
      recommendedAudience: 'Comércio, Serviços, Moradores e Público Geral',
      description: `Pólo de maior adensamento de tráfego de passageiros e veículos de app em ${cityData.city}.`
    },
    {
      id: `${cityId}_shopping_hub`,
      name: `Shopping & Polo Gastronômico de ${cityData.city}`,
      category: 'shopping',
      city: cityData.city,
      state: cityData.state,
      lat: cityData.lat + 0.015,
      lng: cityData.lng + 0.012,
      address: `Avenida Principal / Shopping - ${cityData.city}`,
      dailyEstimatedFootfall: 35000,
      recommendedAudience: 'Consumidores, Lazer, Gastronomia e Famílias',
      description: `Concentração de lojas de departamento, restaurantes e centros de convivência.`
    }
  ];

  const fullCityData: CityGeographicData = {
    city: cityData.city.trim(),
    state: (cityData.state || 'BR').toUpperCase().trim(),
    country: cityData.country || 'Brasil',
    lat: Number(cityData.lat),
    lng: Number(cityData.lng),
    zoom: cityData.zoom || 13,
    region: cityData.region || `Interior / Região de ${cityData.city}`,
    population: cityData.population || 'Cadastrada pelo Usuário',
    poles: defaultPoles
  };

  // Check if city already exists in custom database, update or insert
  const index = customCities.findIndex(c => c.city.toLowerCase() === fullCityData.city.toLowerCase());
  if (index >= 0) {
    customCities[index] = fullCityData;
  } else {
    customCities.push(fullCityData);
  }

  try {
    localStorage.setItem(CUSTOM_CITIES_STORAGE_KEY, JSON.stringify(customCities));
  } catch (err) {
    console.error('Error saving custom city:', err);
  }

  return fullCityData;
}

/**
 * Add a custom pole to an existing (standard or custom) city
 */
export function addCustomPoleToCity(cityName: string, pole: GeographicPole): boolean {
  const customCities = getCustomCities();
  let city = customCities.find(c => c.city.toLowerCase() === cityName.toLowerCase());
  
  if (!city) {
    // If it's a static database city, clone it to custom cities to allow pole additions
    const staticCity = CITIES_GEOGRAPHIC_DATABASE.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    if (staticCity) {
      city = { ...staticCity, poles: [...staticCity.poles] };
      customCities.push(city);
    } else {
      return false;
    }
  }

  // Add pole if not already present
  if (!city.poles.some(p => p.id === pole.id)) {
    city.poles.push(pole);
    try {
      localStorage.setItem(CUSTOM_CITIES_STORAGE_KEY, JSON.stringify(customCities));
      return true;
    } catch (err) {
      console.error('Error updating custom pole:', err);
      return false;
    }
  }
  return true;
}

/**
 * Get all available cities (default database + all user-registered custom cities)
 */
export function getAllCities(): CityGeographicData[] {
  const custom = getCustomCities();
  // Filter out any default that was overridden in custom
  const customNames = new Set(custom.map(c => c.city.toLowerCase()));
  const filteredDefaults = CITIES_GEOGRAPHIC_DATABASE.filter(c => !customNames.has(c.city.toLowerCase()));
  return [...filteredDefaults, ...custom];
}

/**
 * Smart city and geographic pole search engine across default and custom registered cities
 */
export function findCityData(cityNameOrQuery: string): CityGeographicData | undefined {
  if (!cityNameOrQuery) return undefined;
  const clean = cityNameOrQuery.trim().toLowerCase();
  const all = getAllCities();
  
  // Exact or contains match
  return all.find(c => 
    c.city.toLowerCase() === clean ||
    clean.includes(c.city.toLowerCase()) ||
    c.city.toLowerCase().includes(clean) ||
    `${c.city} - ${c.state}`.toLowerCase().includes(clean) ||
    `${c.city}, ${c.state}`.toLowerCase().includes(clean)
  );
}

/**
 * Filter suggestions for autocomplete
 */
export function searchCitySuggestions(query: string): CityGeographicData[] {
  const all = getAllCities();
  if (!query || query.trim().length === 0) return all.slice(0, 12);
  const clean = query.trim().toLowerCase();
  return all.filter(c => 
    c.city.toLowerCase().includes(clean) ||
    c.state.toLowerCase().includes(clean) ||
    c.region.toLowerCase().includes(clean) ||
    c.poles.some(p => p.name.toLowerCase().includes(clean) || p.address.toLowerCase().includes(clean))
  );
}

/**
 * Get all poles for a specific city, or fallback to São Paulo
 */
export function getCityPoles(cityName: string): GeographicPole[] {
  const cityData = findCityData(cityName);
  return cityData ? cityData.poles : (getAllCities()[0]?.poles || CITIES_GEOGRAPHIC_DATABASE[0].poles);
}

/**
 * Online Geocoding with OSM Nominatim as fallback for any custom Brazilian/World city
 */
export async function geocodeCityOnline(searchQuery: string): Promise<{
  city: string;
  state: string;
  lat: number;
  lng: number;
  displayName: string;
} | null> {
  // First check local high-fidelity database (standard + custom)
  const local = findCityData(searchQuery);
  if (local) {
    return {
      city: local.city,
      state: local.state,
      lat: local.lat,
      lng: local.lng,
      displayName: `${local.city}, ${local.state} - Brasil`
    };
  }

  try {
    const encoded = encodeURIComponent(searchQuery + ', Brasil');
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VeloMediaDOOH/1.0'
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      const item = data[0];
      const parts = item.display_name.split(',');
      const stateCandidate = parts.length > 2 ? parts[parts.length - 2].trim() : 'BR';
      return {
        city: item.name || searchQuery,
        state: stateCandidate.slice(0, 2).toUpperCase() || 'BR',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name
      };
    }
  } catch (err) {
    console.warn('Geocode API fallback note:', err);
  }
  return null;
}
