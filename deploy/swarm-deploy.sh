#!/usr/bin/env bash
# Atualiza SOMENTE o serviço informado do Docker Swarm, aguardando a nova tarefa ficar saudável.
# Em caso de falha, o Swarm faz rollback automático. Não toca em volumes nem em outros serviços.
# Uso: SERVICE=velomedia_app IMAGE=velomedia:TAG ./deploy/swarm-deploy.sh
set -euo pipefail

: "${SERVICE:?Defina SERVICE (nome do serviço do Swarm)}"
: "${IMAGE:?Defina IMAGE (imagem já construída, com tag imutável)}"

docker service inspect "$SERVICE" >/dev/null

if ! docker service update \
  --image "$IMAGE" \
  --update-order start-first \
  --update-failure-action rollback \
  --update-monitor 30s \
  --rollback-order stop-first \
  --detach=false \
  "$SERVICE"; then
  echo "ERRO: atualização de $SERVICE falhou; rollback acionado pelo Swarm. Verifique: docker service ps --no-trunc $SERVICE" >&2
  exit 1
fi
echo "OK: $SERVICE atualizado para $IMAGE e saudável."
