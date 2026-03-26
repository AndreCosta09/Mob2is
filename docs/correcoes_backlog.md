# Correcoes Mob2is

Estado atualizado em 2026-03-26.

## 1. Menu bottom bar

1. Centralizar melhor os icones da barra inferior.
   Estado: implementado.
2. Remover o efeito de raio nas extremidades inferiores da barra.
   Estado: implementado.
3. Ajustar o visual da barra "Onde deseja ir".
   Estado: implementado.

## 2. Explorar

1. Subir os botoes flutuantes de filtros e centragem.
   Estado: implementado.
2. Remover a opcao "Mostrar a acessibilidade das ruas" do painel de filtros.
   Estado: implementado.
3. Ao selecionar um ponto manual no mapa, mostrar aviso de que podem nao existir classificacoes de acessibilidade.
   Estado: implementado.
4. Agrupar os POIs em clusters e expandi-los com zoom.
   Estado: implementado.
5. Nao mostrar imagem ao selecionar um ponto manual/aleatorio.
   Estado: implementado.

## 3. Rotas

1. Permitir cancelar o estado "A calcular rota".
   Estado: implementado.
2. Fazer desaparecer automaticamente o erro de calculo/rota.
   Estado: implementado.
3. Ocultar a camada de POIs enquanto a rota esta visivel.
   Estado: implementado.
4. Remover os icones de escadas e declive das opcoes de rota.
   Estado: implementado.
5. Reduzir a espessura da linha de preview da rota.
   Estado: implementado.
6. Mostrar ETA em horas quando ultrapassa 60 minutos.
   Estado: implementado.
7. Em modo de navegacao, mostrar apenas "A navegar" no cabecalho do detalhe.
   Estado: implementado.
8. Em modo de navegacao, remover tambem os icones de escadas e declive.
   Estado: implementado.
9. Corrigir o gesto/animacao de deslizar para fechar o detalhe da rota em navegacao.
   Estado: implementado.
10. Atualizar ETA e distancia com valores reais ao selecionar um POI.
    Estado: implementado.

## 4. Categorias

1. Remover o fundo com o logotipo Mob2is.
   Estado: implementado.
2. Simplificar as animacoes de entrada e selecao.
   Estado: implementado.
3. Ocultar a acao "Navegar pelo interior".
   Estado: implementado.

## 5. Definicoes

1. Uniformizar os simbolos de voltar.
   Estado: implementado.
2. Simplificar a troca de condicao para mostrar a condicao atual e um botao de alteracao.
   Estado: implementado.
3. Atualizar links de politica de privacidade e cookies.
   Estado: pendente por falta dos URLs finais a usar.

## 6. Geral

1. Atualizar o logotipo da aplicacao.
   Estado: pendente por falta do novo asset.
2. Corrigir o caso em que alguns POIs nao aparecem ao abrir a app.
   Estado: mitigado com forcar novo ciclo de render dos marcadores apos o estilo do mapa carregar.

## 7. Dependencias externas

1. Troca de icones por novos assets.
   Estado: pendente por falta dos ficheiros finais.
2. Redesenho completo do cartao de rota.
   Estado: pendente por falta de mockup/criterio visual final.
3. Novas imagens geradas para POIs.
   Estado: pendente por falta de imagens finais.
4. Endpoint dedicado para ETA/km reais fora do fluxo de navegacao.
   Estado: mitigado no cliente com pre-calculo da rota ao selecionar um POI.
