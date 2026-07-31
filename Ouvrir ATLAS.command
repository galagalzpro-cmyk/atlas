#!/bin/zsh
cd "$(dirname "$0")"
PORT=4173
URL="http://127.0.0.1:${PORT}"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 n'est pas disponible. Ouverture directe du prototype."
  open index.html
  exit 0
fi
if curl -s "$URL" >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi
python3 -m http.server "$PORT" --bind 127.0.0.1 > .atlas-server.log 2>&1 &
SERVER_PID=$!
sleep 1
open "$URL"
echo "ATLAS est ouvert sur $URL"
echo "Laissez cette fenêtre ouverte. Appuyez sur Ctrl+C pour arrêter le serveur."
wait "$SERVER_PID"
