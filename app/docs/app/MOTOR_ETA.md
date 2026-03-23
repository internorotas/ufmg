# Motor de Previsao de Chegada (ETA)

## Objetivo

Este documento explica, de forma didática, como a aplicacao estima o tempo de chegada dos Internoes sem depender de rastreamento GPS em tempo real.

A estrategia combina:

- grade de horarios da linha;
- tempo progressivo entre paradas;
- ajuste de trafego por faixa horaria;
- regra de contorno para virada de meia-noite.

## 1) Fonte de horarios: linhas.ts + filtro por dia

A base de horarios vem de [app/src/data/linhas.ts](../../src/data/linhas.ts). Cada linha possui um campo `horarios` (legado em array simples ou estrutura por tipo de dia).

No calculo, a funcao `obterHorariosLinhaNoDia` em [app/src/lib/utils.ts](../../src/lib/utils.ts) resolve qual conjunto e valido para a data atual.

Isso garante que a previsao:

- use horarios corretos para o dia (dias uteis, sabados, domingos/ferias quando aplicavel);
- descarte horarios invalidos;
- retorne `null` quando nao houver operacao no dia.

## 2) Tempo progressivo por parada (tempoDoAnteriorMinutos)

O campo `trajetoDetalhado` da linha define uma sequencia ordenada de paradas com `tempoDoAnteriorMinutos`.

Exemplo conceitual:

- Parada A: 0 min (origem)
- Parada B: +2 min
- Parada C: +3 min

Se o usuario consultar a Parada C, o algoritmo soma os tempos acumulados desde a origem ate essa parada.

No codigo, isso acontece na funcao `calcularPrevisaoChegada` em [app/src/hooks/usePrevisaoChegada.ts](../../src/hooks/usePrevisaoChegada.ts):

- percorre o `trajetoDetalhado`;
- acumula o tempo de cada trecho;
- interrompe ao encontrar `idParadaAtual`.

Esse acumulado representa o deslocamento esperado entre a partida do onibus e a parada consultada.

## 3) Ajuste de trafego: trafegoConfig.ts + isTrechoExterno

A configuracao de trafego fica em [app/src/config/trafegoConfig.ts](../../src/config/trafegoConfig.ts).

Ela define janelas horarias com multiplicador:

- pico da manha;
- faixa de almoco;
- pico da tarde.

A regra-chave e seletiva: o multiplicador so penaliza trechos com `isTrechoExterno = true`.

Por que isso e importante:

- evita inflar artificialmente ETA em trechos internos do campus,
- concentra o impacto nas avenidas mais sujeitas a congestionamento,
- melhora realismo sem precisar de telemetria ao vivo.

Em termos de formula:

- trecho interno: `tempoReal = tempoBase`
- trecho externo: `tempoReal = tempoBase * multiplicadorTrafego`

Depois, o total e arredondado para minutos inteiros para manter previsao consistente na interface.

## 4) Contorno matematico da virada da meia-noite

Sem tratamento especial, horarios perto de 00:00 podem gerar diferencas negativas ou interpretacao incorreta de "onibus ja passou".

O algoritmo usa uma regra de janela:

- se agora estiver no fim do dia (apos 22:00),
- e a chegada prevista cair nas primeiras horas (ate 02:00),
- a chegada e ajustada para o "dia seguinte" somando 1440 minutos.

Na pratica, isso evita erro de comparacao entre:

- `23:55` (hoje) e
- `00:10` (manha seguinte).

Assim, o sistema consegue apontar corretamente:

- proximo onibus;
- minutos faltantes;
- ultimo onibus recente (janela curta de ate 15 minutos).

## Fluxo resumido do calculo

1. Seleciona os horarios validos para o dia.
2. Calcula o tempo acumulado ate a parada alvo.
3. Aplica multiplicador de trafego apenas nos trechos externos.
4. Soma horario de partida + tempo acumulado para cada viagem.
5. Aplica regra de virada de meia-noite quando necessario.
6. Retorna:
   - proximo onibus,
   - ultimo onibus recente,
   - indicador de trafego intenso.

## Arquivos principais envolvidos

- [app/src/hooks/usePrevisaoChegada.ts](../../src/hooks/usePrevisaoChegada.ts)
- [app/src/config/trafegoConfig.ts](../../src/config/trafegoConfig.ts)
- [app/src/lib/utils.ts](../../src/lib/utils.ts)
- [app/src/data/linhas.ts](../../src/data/linhas.ts)

## Resultado para o produto

Com essa abordagem, o Interno Rotas entrega previsao util e estavel com baixo custo de operacao, sem dependencia de GPS em tempo real, mantendo boa experiencia para o contexto da UFMG.
