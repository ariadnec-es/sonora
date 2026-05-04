https://github.com/ariadnec-es/sonora/issues/3#issue-4376531549

## User Story

**Como**  usuário comum(cliente/público)
**Eu quero**  enviar uma ou mais músicas para um evento específico, informando ordem,cantor, nome, link e observação,
**Para que**  o gerente possa usá-las no evento.

---

## Métricas

|Campo| Valor|
|--------|--------|
|**Prioridade**| Alta|
|**Estimativa**| 5 pontos|

---

## Critérios de Aceitação

1. O Formulário deve ter: nome da pessoa, seleção do evento, e uma seção dinâmica para adicionar múltiplas músicas.
2. Para cada música: ordem(número), nome do cantor, nome da música, link(YouTube), observação (campo de texto livre).
3. O botão de "Adicionar música", permite incluir quantas músicas forem necessárias.
4. O campo "ordem" é obrigatório e não pode haver duas músicas com a mesma ordem.
5. Após enviar, a solicitação aparece na mídia do evento com status "pendente".

## Brench

feature/US03-enviar-solicitacao-musica
