# NAS Deployment Protocol (Strict) 🤖

This project defaults to the port currently published on the NAS.

- If `finely` is already running, the deploy script auto-detects the existing host port and reuses it.
- If it is not running, the deploy script falls back to `3015` (overrideable).

## 🛑 CRITICAL: BUILD LOCALLY, DEPLOY GLOBALLY
The NAS is slow. **DO NOT** try to build the Docker image on the NAS.
The deployment script is designed to:
1.  Build the frontend locally (PC).
2.  Build the Docker image locally (PC).
3.  **Stream** the finished image to the NAS via SSH.

If you try to send source code and build on the NAS, you will be fired.

---

## Phase 1: Reconnaissance (DO THIS FIRST)

Before running any scripts, you must SSH into the NAS and check the state of the world.

1.  **Check for Existing Deployment:**
    Run this command to check if the project (`finely`) is already running and what port it is using.
    ```bash
    ssh skode-admin@10.10.10.3 "/usr/local/bin/docker ps --filter name=finely --format '{{.Ports}}'"
    ```
    -   **IF IT RETURNS A PORT (e.g., `0.0.0.0:3010->80/tcp`):**
        -   Extract the host port (e.g., `3010`).
        -   **YOU MUST REUSE THIS PORT.**
        -   Proceed to Phase 2 using this port.

2.  **IF IT IS A NEW DEPLOYMENT (No output from Step 1):**
    You need to find a free port.
    Run this command to list ALL used ports:
    ```bash
    ssh skode-admin@10.10.10.3 "/usr/local/bin/docker ps --format '{{.Ports}}'"
    ```
    -   Analyze the list.
    -   Pick a port number (e.g., between 3000-4000) that is **NOT** in that list.
    -   Proceed to Phase 2 using this new port.

---

## Phase 2: Execution

You can pass a port explicitly, or omit it to auto-detect/reuse the current port.

```bash
# Usage:
./scripts/deploy-nas.sh            # reuse existing port, else 3015
./scripts/deploy-nas.sh <PORT>     # force a specific port
```

**Example:**
If the app is already running on `3015`:
```bash
./scripts/deploy-nas.sh

# Or explicitly
./scripts/deploy-nas.sh 3015
```

## Phase 3: Troubleshooting

-   **"Bind for 0.0.0.0:xxxx failed: port is already allocated"**:
    -   You messed up Phase 1. You picked a port that is busy.
    -   Go back to Phase 1, check `docker ps` again, and pick a truly free port.
-   **Docker not found?**
    -   Ensure you are running this from a terminal that has Docker installed (e.g., PowerShell on Windows or WSL2 with Docker integration). The script builds LOCALLY.
