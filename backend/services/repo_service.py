"""
Fetches source code files from public GitHub and GitLab repositories.
"""
import re
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
from typing import List, Tuple, Optional

# File extensions to analyze
SUPPORTED_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb', '.php', '.cs'}
MAX_FILES = 40          # cap to avoid timeout
MAX_FILE_SIZE = 50_000  # bytes

def _headers(token: Optional[str] = None, platform: str = "github") -> dict:
    h = {"Accept": "application/vnd.github+json"}
    if token:
        prefix = "Bearer" if platform == "github" else "Bearer"
        h["Authorization"] = f"{prefix} {token}"
    return h


# ── GitHub ──────────────────────────────────────────────────────────────────

def _parse_github_url(url: str) -> Tuple[str, str]:
    """Return (owner, repo) from a github.com URL."""
    url = url.rstrip("/").removesuffix(".git")
    m = re.search(r"github\.com[:/]([^/]+)/([^/]+)", url)
    if not m:
        raise ValueError("Not a valid GitHub URL")
    return m.group(1), m.group(2)


def fetch_github_files(url: str, branch: str = "main", token: str = None) -> List[Tuple[str, str]]:
    """Return list of (path, content) for supported source files."""
    owner, repo = _parse_github_url(url)
    h = _headers(token, "github")

    # Try main then master
    for ref in [branch, "master", "main"]:
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{ref}?recursive=1"
        r = requests.get(tree_url, headers=h, timeout=10)
        if r.status_code == 200:
            break
    if r.status_code != 200:
        raise RuntimeError(f"GitHub API error {r.status_code}: {r.text[:200]}")

    items = r.json().get("tree", [])
    files = [
        i for i in items
        if i["type"] == "blob"
        and os.path.splitext(i["path"])[1] in SUPPORTED_EXTENSIONS
        and i.get("size", 999999) < MAX_FILE_SIZE
    ][:MAX_FILES]

    results = []
    for item in files:
        raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{item['path']}"
        cr = requests.get(raw_url, headers=h, timeout=8)
        if cr.status_code == 200:
            results.append((item["path"], cr.text))
    return results


# ── GitLab ──────────────────────────────────────────────────────────────────

def _parse_gitlab_url(url: str) -> str:
    """Return URL-encoded namespace/project path."""
    url = url.rstrip("/").removesuffix(".git")
    m = re.search(r"gitlab\.com[:/](.+)", url)
    if not m:
        raise ValueError("Not a valid GitLab URL")
    return requests.utils.quote(m.group(1), safe="")


def fetch_gitlab_files(url: str, branch: str = "main", token: str = None) -> List[Tuple[str, str]]:
    """Return list of (path, content) for supported source files."""
    h = {"PRIVATE-TOKEN": token} if token else {}
    project_path = _parse_gitlab_url(url)

    tree_url = (
        f"https://gitlab.com/api/v4/projects/{project_path}"
        f"/repository/tree?recursive=true&per_page=100"
    )
    r = requests.get(tree_url, headers=h, timeout=10)
    if r.status_code != 200:
        raise RuntimeError(f"GitLab API error {r.status_code}: {r.text[:200]}")

    items = [
        i for i in r.json()
        if i["type"] == "blob"
        and os.path.splitext(i["path"])[1] in SUPPORTED_EXTENSIONS
    ][:MAX_FILES]

    results = []
    for item in items:
        file_url = (
            f"https://gitlab.com/api/v4/projects/{project_path}"
            f"/repository/files/{requests.utils.quote(item['path'], safe='')}/raw?ref={branch}"
        )
        cr = requests.get(file_url, headers=h, timeout=8)
        if cr.status_code == 200:
            results.append((item["path"], cr.text))
    return results


# ── Dispatcher ──────────────────────────────────────────────────────────────

def fetch_repo_files(url: str, branch: str = "main", token: str = None) -> List[Tuple[str, str]]:
    """Auto-detect platform and fetch files. Returns [] on failure."""
    try:
        if "github.com" in url:
            return fetch_github_files(url, branch, token)
        elif "gitlab.com" in url:
            return fetch_gitlab_files(url, branch, token)
    except Exception as e:
        print(f"[repo_service] fetch error: {e}")
    return []
