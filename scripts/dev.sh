#!/usr/bin/env bash
# 一键启动测试环境：
#   - 后端: ./data_dev 数据目录 + demo 种子数据，监听 :3000
#   - 前端: vite dev server，监听 :5173（/api 代理到 :3000）
# 用法: scripts/dev.sh          # 启动后端 + 前端（Ctrl+C 一起退出）
#       scripts/dev.sh backend  # 仅后端
#       scripts/dev.sh frontend # 仅前端
set -euo pipefail
cd "$(dirname "$0")/.."

BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
export HAVIT_DATA_DIR="${HAVIT_DATA_DIR:-./data_dev}"
# 默认 demo（首次运行注入种子数据）；已有测试库时 demo 会拒绝启动，自动回落 release。
# 显式设置 HAVIT_MODE 时以用户为准。
if [[ -z "${HAVIT_MODE:-}" ]]; then
  if [[ -f "$HAVIT_DATA_DIR/havit.db" ]]; then
    HAVIT_MODE=release
  else
    HAVIT_MODE=demo
  fi
fi
export HAVIT_MODE
export HAVIT_SERVER_PORT="${BACKEND_PORT}"

TARGET="${1:-all}"

BACKEND_PID=""
cleanup() {
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

start_backend() {
  echo "==> go build ./cmd/havit"
  go build -o tmp/havit-dev ./cmd/havit
  echo "==> backend starting (mode=$HAVIT_MODE data=$HAVIT_DATA_DIR port=$BACKEND_PORT)"
  tmp/havit-dev &
  BACKEND_PID=$!

  for _ in $(seq 1 30); do
    if curl -fsS "http://localhost:$BACKEND_PORT/api/v1/healthz" >/dev/null 2>&1; then
      echo "==> backend ready: http://localhost:$BACKEND_PORT"
      return 0
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "backend exited unexpectedly" >&2
      return 1
    fi
    sleep 0.5
  done
  echo "backend health check timed out" >&2
  return 1
}

start_frontend() {
  echo "==> frontend starting: http://localhost:$FRONTEND_PORT"
  (cd web && pnpm exec vite --port "$FRONTEND_PORT" --strictPort)
}

case "$TARGET" in
  backend)  start_backend; wait "$BACKEND_PID" ;;
  frontend) start_frontend ;;
  all)      start_backend; start_frontend ;;
  *)        echo "unknown target: $TARGET (use backend | frontend | all)" >&2; exit 2 ;;
esac
