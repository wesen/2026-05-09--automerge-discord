#!/usr/bin/env python3
"""devctl plugin for the AUTODISCO local development environment.

Protocol rule: stdout is NDJSON only. Human logs go to stderr.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

PLUGIN_NAME = "autodisco"
DEFAULT_PORT = "3030"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PUBLIC_BASE_URL = "http://localhost:3030"
DEFAULT_DATA_DIR = ".devctl/data/autodisco"
DEFAULT_WEB_PORT = "5174"
DEFAULT_STORYBOOK_PORT = "6006"


def emit(obj: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(obj, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def log(message: str) -> None:
    sys.stderr.write(f"[{PLUGIN_NAME}] {message}\n")
    sys.stderr.flush()


def response_ok(request_id: str, output: dict[str, Any]) -> None:
    emit({"type": "response", "request_id": request_id, "ok": True, "output": output})


def response_error(request_id: str, code: str, message: str) -> None:
    emit({
        "type": "response",
        "request_id": request_id,
        "ok": False,
        "error": {"code": code, "message": message},
    })


def repo_root(ctx: dict[str, Any]) -> Path:
    return Path(str(ctx.get("repo_root") or os.getcwd())).resolve()


def merged_env(config: dict[str, Any] | None = None) -> dict[str, str]:
    env = {
        "PORT": DEFAULT_PORT,
        "HOST": DEFAULT_HOST,
        "PUBLIC_BASE_URL": DEFAULT_PUBLIC_BASE_URL,
        "DATA_DIR": DEFAULT_DATA_DIR,
    }
    if config:
        config_env = config.get("env")
        if isinstance(config_env, dict):
            env.update({str(k): str(v) for k, v in config_env.items()})
    env.update({key: os.environ[key] for key in env.keys() if key in os.environ})
    return env


def run_command(argv: list[str], cwd: Path, timeout_s: int | None = None) -> int:
    log(f"running: {' '.join(argv)}")
    proc = subprocess.run(
        argv,
        cwd=str(cwd),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout_s,
        check=False,
    )
    if proc.stdout:
        sys.stderr.write(proc.stdout)
    if proc.stderr:
        sys.stderr.write(proc.stderr)
    sys.stderr.flush()
    return int(proc.returncode)


def handle_config_mutate(request_id: str) -> None:
    response_ok(request_id, {
        "config_patch": {
            "set": {
                "env.PORT": DEFAULT_PORT,
                "env.HOST": DEFAULT_HOST,
                "env.PUBLIC_BASE_URL": DEFAULT_PUBLIC_BASE_URL,
                "env.DATA_DIR": DEFAULT_DATA_DIR,
                "services.chat-server.port": DEFAULT_PORT,
                "services.chat-server.url": DEFAULT_PUBLIC_BASE_URL,
                "services.chat-server.health_url": f"{DEFAULT_PUBLIC_BASE_URL}/healthz",
                "services.chat-server.sync_url": "ws://localhost:3030/sync",
                "services.web.port": DEFAULT_WEB_PORT,
                "services.web.url": "http://localhost:5174",
                "services.storybook.port": DEFAULT_STORYBOOK_PORT,
                "services.storybook.url": "http://localhost:6006",
            },
            "unset": [],
        }
    })


def handle_validate(request_id: str, ctx: dict[str, Any]) -> None:
    root = repo_root(ctx)
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    for tool in ("node", "npm"):
        if shutil.which(tool) is None:
            errors.append({"code": "E_MISSING_TOOL", "message": f"missing required tool: {tool}"})

    for rel in ("package.json", "packages/chat-server/package.json", "packages/chat-core/package.json"):
        if not (root / rel).exists():
            errors.append({"code": "E_MISSING_FILE", "message": f"missing expected file: {rel}"})

    if not (root / "node_modules").exists():
        errors.append({"code": "E_DEPS_MISSING", "message": "node_modules not found; run npm install"})

    if not (root / "package-lock.json").exists():
        warnings.append({"code": "W_NO_LOCKFILE", "message": "package-lock.json not found; dependency versions may drift"})

    response_ok(request_id, {"valid": len(errors) == 0, "errors": errors, "warnings": warnings})


def handle_launch_plan(request_id: str, ctx: dict[str, Any], input_obj: dict[str, Any]) -> None:
    config = input_obj.get("config") if isinstance(input_obj.get("config"), dict) else {}
    env = merged_env(config)
    root = repo_root(ctx)
    if not Path(env["DATA_DIR"]).is_absolute():
        env["DATA_DIR"] = str(root / env["DATA_DIR"])
    port = env["PORT"]
    host = env["HOST"]
    public_base_url = env["PUBLIC_BASE_URL"]
    health_host = "127.0.0.1" if host in {"0.0.0.0", "::"} else host

    if ctx.get("dry_run"):
        log("dry-run: returning launch plan without starting services")

    response_ok(request_id, {
        "services": [
            {
                "name": "chat-server",
                "cwd": ".",
                "command": ["npm", "run", "dev:server"],
                "env": env,
                "health": {
                    "type": "http",
                    "url": f"http://{health_host}:{port}/healthz",
                    "timeout_ms": 30000,
                },
            },
            {
                "name": "web",
                "cwd": ".",
                "command": ["npm", "run", "dev:web"],
                "env": {"VITE_API_BASE_URL": public_base_url, "VITE_DEV_PORT": DEFAULT_WEB_PORT},
                "health": {"type": "http", "url": "http://127.0.0.1:5174", "timeout_ms": 30000},
            },
            {
                "name": "storybook",
                "cwd": ".",
                "command": ["npm", "run", "storybook", "--", "--no-open"],
                "env": {"VITE_API_BASE_URL": public_base_url},
                "health": {"type": "http", "url": "http://127.0.0.1:6006", "timeout_ms": 30000},
            },
        ],
        "notes": [
            f"HTTP API: {public_base_url}",
            f"Automerge sync: ws://localhost:{port}/sync",
            "Vite web: http://localhost:5174",
            "Storybook: http://localhost:6006",
        ],
    })


def handle_command_run(request_id: str, ctx: dict[str, Any], input_obj: dict[str, Any]) -> None:
    root = repo_root(ctx)
    name = str(input_obj.get("name") or "")
    config = input_obj.get("config") if isinstance(input_obj.get("config"), dict) else {}
    env = merged_env(config)

    try:
        if name == "check":
            for argv in (["npm", "run", "typecheck"], ["npm", "run", "build"], ["npm", "test"], ["npm", "--workspace", "@autodisco/chat-web", "run", "build-storybook"]):
                code = run_command(list(argv), root)
                if code != 0:
                    response_ok(request_id, {"exit_code": code})
                    return
            response_ok(request_id, {"exit_code": 0})
            return

        if name == "test-web-sync":
            code = run_command(["npm", "--workspace", "@autodisco/chat-web", "run", "test:e2e"], root)
            response_ok(request_id, {"exit_code": code})
            return

        if name == "bootstrap-workspace":
            workspace_name = "Devctl Guild"
            argv = input_obj.get("argv")
            if isinstance(argv, list) and argv:
                workspace_name = str(argv[0])
            url = f"{env['PUBLIC_BASE_URL'].rstrip('/')}/api/bootstrap/workspaces"
            payload = json.dumps({"name": workspace_name}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"content-type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
            log(body)
            response_ok(request_id, {"exit_code": 0, "workspace": json.loads(body)})
            return

        response_error(request_id, "E_UNKNOWN_COMMAND", f"unknown command: {name}")
    except subprocess.TimeoutExpired as exc:
        response_error(request_id, "E_TIMEOUT", f"command timed out: {exc}")
    except urllib.error.URLError as exc:
        response_error(request_id, "E_HTTP", f"bootstrap request failed: {exc}")
    except Exception as exc:  # noqa: BLE001 - plugin boundary should convert all errors to protocol errors.
        response_error(request_id, "E_PLUGIN", str(exc))


emit({
    "type": "handshake",
    "protocol_version": "v2",
    "plugin_name": PLUGIN_NAME,
    "capabilities": {
        "ops": ["config.mutate", "validate.run", "launch.plan", "command.run"],
        "commands": [
            {"name": "check", "help": "Run typecheck, build, and tests for AUTODISCO"},
            {"name": "test-web-sync", "help": "Run Playwright two-session browser sync test against the running dev services"},
            {"name": "bootstrap-workspace", "help": "Create a workspace against the running dev server; optional first arg is the workspace name"},
        ],
    },
})

for raw_line in sys.stdin:
    line = raw_line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        request_id = str(req.get("request_id") or "")
        op = str(req.get("op") or "")
        ctx = req.get("ctx") if isinstance(req.get("ctx"), dict) else {}
        input_obj = req.get("input") if isinstance(req.get("input"), dict) else {}

        if op == "config.mutate":
            handle_config_mutate(request_id)
        elif op == "validate.run":
            handle_validate(request_id, ctx)
        elif op == "launch.plan":
            handle_launch_plan(request_id, ctx, input_obj)
        elif op == "command.run":
            handle_command_run(request_id, ctx, input_obj)
        else:
            response_error(request_id, "E_UNSUPPORTED", f"unsupported op: {op}")
    except Exception as exc:  # noqa: BLE001
        response_error("", "E_PROTOCOL", str(exc))
