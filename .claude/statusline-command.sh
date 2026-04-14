#!/usr/bin/env bash
input=$(cat)

# Model
model=$(echo "$input" | jq -r '.model.display_name // "Claude"')

# Directory
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
dir=$(basename "$cwd")

# Git branch (skip optional locks)
branch=""
if git -C "$cwd" rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git -C "$cwd" -c gc.auto=0 symbolic-ref --short HEAD 2>/dev/null)
fi

# Context usage
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# Rate limits
five_h=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

# Vim mode
vim_mode=$(echo "$input" | jq -r '.vim.mode // empty')

# Build status line with ANSI colors
line=""

# Model
line="${line}\033[1;36m${model}\033[0m"

# Dir + branch
line="${line}  \033[33m${dir}"
[ -n "$branch" ] && line="${line} \033[2;33m(${branch})"
line="${line}\033[0m"

# Context usage
if [ -n "$used" ]; then
  ctx_int=$(printf '%.0f' "$used")
  line="${line}  \033[32mctx:${ctx_int}%\033[0m"
fi

# Rate limits
rate_str=""
[ -n "$five_h" ] && rate_str="5h:$(printf '%.0f' "$five_h")%"
[ -n "$week" ] && rate_str="${rate_str} 7d:$(printf '%.0f' "$week")%"
[ -n "$rate_str" ] && line="${line}  \033[35m${rate_str}\033[0m"

# Vim mode
[ -n "$vim_mode" ] && line="${line}  \033[1;34m[${vim_mode}]\033[0m"

printf "${line}\n"
