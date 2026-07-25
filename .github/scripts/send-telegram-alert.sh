#!/usr/bin/env bash
set -euo pipefail

alert_status="${1:?alert status is required}"
stage_name="${STAGE_NAME:?STAGE_NAME is required}"
stage_result="${STAGE_RESULT:-}"
telegram_bot_token="${TELEGRAM_BOT_TOKEN:-}"
telegram_chat_ids="${TELEGRAM_CHAT_IDS:-${TELEGRAM_CHAT_ID:-}}"
telegram_thread_id="${TELEGRAM_THREAD_ID:-}"

if [ -z "${telegram_bot_token}" ] || [ "${telegram_bot_token}" = "PUT_TELEGRAM_BOT_TOKEN_HERE" ] || \
   [ -z "${telegram_chat_ids}" ] || [ "${telegram_chat_ids}" = "PUT_TELEGRAM_CHAT_ID_HERE" ] || \
   [ "${telegram_chat_ids}" = "PUT_TELEGRAM_CHAT_IDS_HERE" ]; then
  echo "Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID/TELEGRAM_CHAT_IDS is not configured."
  exit 0
fi

short_sha="${GITHUB_SHA::7}"
run_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

html_escape() {
  local value="$1"
  value="${value//&/&amp;}"
  value="${value//</&lt;}"
  value="${value//>/&gt;}"
  value="${value//\"/&quot;}"
  printf '%s' "${value}"
}

repo="$(html_escape "${GITHUB_REPOSITORY}")"
stage="$(html_escape "${stage_name}")"
branch="$(html_escape "${GITHUB_REF_NAME}")"
actor="$(html_escape "${GITHUB_ACTOR}")"
result="$(html_escape "${stage_result}")"

if [ "${alert_status}" = "success" ]; then
  message="$(cat <<EOF
✅ <b>Успешно</b>

<b>Repository:</b> <code>${repo}</code>
<b>Stage:</b> <code>${stage}</code>
<b>Branch:</b> <code>${branch}</code>
<b>Commit:</b> <code>${short_sha}</code>
<b>Actor:</b> <code>${actor}</code>

<a href="${run_url}">GitHub Actions log</a>
EOF
)"
else
  message="$(cat <<EOF
❌ <b>Ошибка</b>

<b>Repository:</b> <code>${repo}</code>
<b>Stage:</b> <code>${stage}</code>
<b>Branch:</b> <code>${branch}</code>
<b>Commit:</b> <code>${short_sha}</code>
<b>Actor:</b> <code>${actor}</code>
<b>Status:</b> <code>${result}</code>

<b>Error:</b> stage <code>${stage}</code> finished with <code>${result}</code>
<a href="${run_url}">GitHub Actions log</a>
EOF
)"
fi

api_url="https://api.telegram.org/bot${telegram_bot_token}/sendMessage"

send_telegram_message() {
  local chat_id="$1"
  local -a curl_args=(
    --fail
    --show-error
    --silent
    --output /dev/null
    --request POST
    "${api_url}"
    --data "chat_id=${chat_id}"
    --data-urlencode "text=${message}"
    --data "parse_mode=HTML"
    --data "disable_web_page_preview=true"
  )

  if [ -n "${telegram_thread_id}" ]; then
    curl_args+=(--data "message_thread_id=${telegram_thread_id}")
  fi

  curl "${curl_args[@]}" || echo "Telegram notification failed for chat ${chat_id}."
}

IFS=', ' read -r -a telegram_chat_id_list <<< "${telegram_chat_ids}"
for chat_id in "${telegram_chat_id_list[@]}"; do
  [ -z "${chat_id}" ] && continue
  send_telegram_message "${chat_id}"
done
