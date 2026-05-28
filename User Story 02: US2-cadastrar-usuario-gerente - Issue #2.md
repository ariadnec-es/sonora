https://github.com/ariadnec-es/sonora/issues/2#issue-4376474080

## User Story

**Como**  administrador do sistema
**Eu quero**  cadastrar um novo gerente e vinculá-lo a um ou mais eventos,
**Para que**  ele ele tenha acesso apenas às mídias daquele evento.

---

## Métricas

|Campo| Valor|
|--------|--------|
|**Prioridade**| Alta|
|**Estimativa**| 3 pontos|

---

## Critérios de Aceitação

1. O cadastro deve conter: nome, e-mail, senha, eventos aos quais terá acesso.
2. Um mesmo usuário gerente pode ser vinculado a múltiplos eventos.
3. A senha deve ser armazenada de forma criptografada.
4. O usuário gerente só enxergará os eventos a que foi vinculado.

## Brench

feature/US02-cadastrar-usuario-gerente
