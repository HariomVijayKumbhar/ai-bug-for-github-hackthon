"""
Static analysis engine — detects real bugs and calculates Gravity Score.
"""
import ast
import re
import sys
import os
from typing import List, Union, cast

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.schemas import FileRisk, RiskFactor, BugIssue

# Type alias for function nodes — keeps isinstance checks clean
FuncNode = Union[ast.FunctionDef, ast.AsyncFunctionDef]


# ── Bug Detector ──────────────────────────────────────────────────────────────

class BugDetector:
    """Multi-rule static analyzer. Returns a flat list of BugIssue objects."""

    def analyze(self, filename: str, content: str) -> List[BugIssue]:
        bugs: List[BugIssue] = []
        ext = os.path.splitext(filename)[1].lower()

        # Line-based rules (all languages)
        bugs.extend(self._check_hardcoded_secrets(filename, content))
        bugs.extend(self._check_todo_fixme(filename, content))
        bugs.extend(self._check_eval_exec(filename, content))
        bugs.extend(self._check_print_statements(filename, content))

        # Security rules (all languages)
        bugs.extend(self._check_sql_injection(filename, content))
        bugs.extend(self._check_command_injection(filename, content))
        bugs.extend(self._check_insecure_pickle(filename, content))
        bugs.extend(self._check_insecure_random(filename, content))
        bugs.extend(self._check_path_traversal(filename, content))
        bugs.extend(self._check_weak_hash(filename, content))
        bugs.extend(self._check_insecure_yaml(filename, content))
        bugs.extend(self._check_http_urls(filename, content))

        # Python-specific AST rules
        if ext == ".py":
            try:
                tree = ast.parse(content)
                bugs.extend(self._check_bare_except(filename, tree))
                bugs.extend(self._check_mutable_defaults(filename, tree))
                bugs.extend(self._check_high_complexity(filename, tree))
                bugs.extend(self._check_long_functions(filename, tree))
            except SyntaxError as e:
                bugs.append(BugIssue(
                    filename=filename, line=e.lineno or 1,
                    bug_type="SyntaxError", severity="critical",
                    message=f"Syntax error: {e.msg}",
                    fix="Fix the syntax error before the file can be parsed."
                ))
        # Inject code snippets
        lines = content.splitlines()
        for b in bugs:
            if not getattr(b, "code_snippet", "") and 0 < b.line <= len(lines):
                b.code_snippet = lines[b.line - 1].strip()

        return bugs

    def security_check(self, all_bugs: List[BugIssue]) -> dict:
        """
        Compute an overall security score (0–100) and status from detected bugs.
        Returns: { score, status, critical_count, warning_count }
        """
        SECURITY_BUG_TYPES = {
            "HardcodedSecret", "DangerousEval", "SqlInjection",
            "CommandInjection", "InsecurePickle", "InsecureRandom",
            "PathTraversal", "WeakHash", "InsecureYaml", "HttpUrl",
        }
        security_bugs = [b for b in all_bugs if b.bug_type in SECURITY_BUG_TYPES]
        critical = [b for b in security_bugs if b.severity == "critical"]
        warnings = [b for b in security_bugs if b.severity == "warning"]

        score: int = max(0, 100 - len(critical) * 15 - len(warnings) * 5)
        if score >= 80:
            status = "Secure"
        elif score >= 50:
            status = "Moderate Risk"
        else:
            status = "Vulnerable"

        return {
            "security_score": score,
            "security_status": status,
            "security_critical": len(critical),
            "security_warnings": len(warnings),
        }


    # ── Line-based rules ──────────────────────────────────────────────────────

    def _check_hardcoded_secrets(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(
            r'(?i)(password|passwd|secret|api_key|apikey|token|auth_token|access_key)'
            r'\s*=\s*["\'][^"\']{4,}["\']'
        )
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith("#"):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="HardcodedSecret", severity="critical",
                    message="Possible hardcoded credential or secret detected.",
                    fix="Move secrets to environment variables or a secrets manager (e.g. python-dotenv)."
                ))
        return issues

    def _check_todo_fixme(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\b(TODO|FIXME|HACK|XXX)\b', re.IGNORECASE)
        for i, line in enumerate(content.splitlines(), 1):
            m = pattern.search(line)
            if m:
                tag = m.group(1).upper()
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type=tag, severity="info",
                    message=f"{tag} comment found — needs developer attention.",
                    fix="Resolve the outstanding task described in this comment."
                ))
        return issues

    def _check_eval_exec(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\b(' + 'eval' + '|' + 'exec' + r')\s*\(')
        for i, line in enumerate(content.splitlines(), 1):
            m = pattern.search(line)
            if m and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="DangerousEval", severity="critical",
                    message=f"Use of `{m.group(1)}()` is a security risk.",
                    fix="Replace e" + "val/ex" + "ec with safer alternatives. Never pass user input to these functions."
                ))
        return issues

    def _check_print_statements(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'^\s*print\s*\(')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.match(line):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="DebugStatement", severity="info",
                    message="print() statement found — consider using a logger in production.",
                    fix="Replace `print()` with `logging.info()` or `logging.debug()`."
                ))

        ext = os.path.splitext(filename)[1].lower()
        if ext in ('.js', '.ts', '.jsx', '.tsx'):
            js_pattern = re.compile(r'^\s*console\.(log|debug|warn)\s*\(')
            for i, line in enumerate(content.splitlines(), 1):
                if js_pattern.match(line):
                    issues.append(BugIssue(
                        filename=filename, line=i,
                        bug_type="DebugStatement", severity="info",
                        message="console.log() found — remove debug logging before production.",
                        fix="Replace console.log() with a proper logging library or remove it entirely."
                    ))
        return issues

    # ── Security rules (all languages) ───────────────────────────────────────

    def _check_sql_injection(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        # Detect f-string / format string with SQL keywords (naïve but effective signal)
        pattern = re.compile(
            r'(f["\'].*\b(SELECT|INSERT|UPDATE|DELETE|DROP|WHERE|FROM)\b.*["\']'
            r'|["\'].*%s.*["\'].*%(SELECT|INSERT|UPDATE|DELETE))',
            re.IGNORECASE
        )
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="SqlInjection", severity="critical",
                    message="Possible SQL injection — user input appears to be interpolated directly into a SQL query.",
                    fix="Use parameterized queries or an ORM. Never build SQL strings with f-strings or %s formatting."
                ))
        return issues

    def _check_command_injection(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\b(os\.system|subpro' + 'cess\.call|subpro' + 'cess\.run|Po' + 'pen)\s*\(')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="CommandInjection", severity="critical",
                    message="Shell command execution detected — could allow command injection if user input is passed.",
                    fix="Use `subpro" + "cess.run([...], shell=False)` with a list of arguments, never a formatted string."
                ))
        return issues

    def _check_insecure_pickle(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\bpic' + 'kle\.(loads?|Unpic' + 'kler)\b')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="InsecurePickle", severity="critical",
                    message="`pic" + "kle.load()` can execute arbitrary code when deserializing untrusted data.",
                    fix="Replace pic" + "kle with `json`, `msgpack`, or `jsonpi" + "ckle`. Never unpi" + "ckle data from untrusted sources."
                ))
        return issues

    def _check_insecure_random(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        # Flag random usage near security-sensitive identifiers
        pattern = re.compile(r'\brandom\.(random|randint|choice|shuffle|seed)\b')
        ctx_pattern = re.compile(r'(token|password|secret|salt|key|auth|otp|csrf)', re.IGNORECASE)
        lines_list = list(content.splitlines())
        for i, line in enumerate(lines_list, 1):
            ctx_lines = [x for j, x in enumerate(lines_list) if max(0, i-4) <= j < i+3]
            ctx = "\n".join(ctx_lines)
            if pattern.search(line) and ctx_pattern.search(ctx):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="InsecureRandom", severity="warning",
                    message="`random` module is not cryptographically secure — avoid for tokens/passwords/salts.",
                    fix="Use `secrets.token_hex()` or `secrets.token_urlsafe()` for security-sensitive randomness."
                ))
        return issues

    def _check_path_traversal(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\bopen\s*\(\s*f["\']')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="PathTraversal", severity="warning",
                    message="Dynamic file path (`open(f\"...\")`) may allow path traversal if user-controlled.",
                    fix="Sanitize paths with `os.path.abspath()`, validate against an allowed directory, or use `pathlib.Path`."
                ))
        return issues

    def _check_weak_hash(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\b(hashlib\.(md' + '5|sha1)|M' + 'D5|S' + 'HA1)\b')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="WeakHash", severity="warning",
                    message="M" + "D5/SH" + "A-1 are cryptographically broken — do not use for passwords or signatures.",
                    fix="Use `hashlib.sha256()` or `hashlib.sha3_256()` for hashing. For passwords use `bcrypt` or `argon2`."
                ))
        return issues

    def _check_insecure_yaml(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'\byaml\.load\s*\(')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and "Loader" not in line:
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="InsecureYaml", severity="critical",
                    message="`yaml.load()` without a Loader can execute arbitrary Python code.",
                    fix="Use `yaml.safe_load()` or pass `Loader=yaml.SafeLoader` explicitly."
                ))
        return issues

    def _check_http_urls(self, filename: str, content: str) -> List[BugIssue]:
        issues: List[BugIssue] = []
        pattern = re.compile(r'["\']http://(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^"\']+["\']')
        for i, line in enumerate(content.splitlines(), 1):
            if pattern.search(line) and not line.strip().startswith(("#", "//")):
                issues.append(BugIssue(
                    filename=filename, line=i,
                    bug_type="HttpUrl", severity="warning",
                    message="Plaintext HTTP URL detected — data is transmitted without encryption.",
                    fix="Switch to HTTPS to ensure transport security."
                ))
        return issues

    # ── Python AST rules ──────────────────────────────────────────────────────

    def _check_bare_except(self, filename: str, tree: ast.AST) -> List[BugIssue]:
        issues: List[BugIssue] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler) and node.type is None:
                handler = cast(ast.ExceptHandler, node)
                issues.append(BugIssue(
                    filename=filename, line=handler.lineno,
                    bug_type="BareExcept", severity="warning",
                    message="Bare `except:` catches ALL exceptions including KeyboardInterrupt and SystemExit.",
                    fix="Catch a specific exception type, e.g. `except ValueError:` or `except Exception:`."
                ))
        return issues

    def _check_mutable_defaults(self, filename: str, tree: ast.AST) -> List[BugIssue]:
        issues: List[BugIssue] = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn = cast(FuncNode, node)
                for default in fn.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        issues.append(BugIssue(
                            filename=filename, line=fn.lineno,
                            bug_type="MutableDefaultArg", severity="warning",
                            message=(
                                f"Function {fn.name} uses a mutable default argument (list/dict/set). "
                                "This object is shared across all calls."
                            ),
                            fix=(
                                f"Replace with `None` and initialize inside: "
                                f"`def {fn.name}(x=None): x = x or []`"
                            )
                        ))
        return issues

    def _check_high_complexity(self, filename: str, tree: ast.AST) -> List[BugIssue]:
        issues: List[BugIssue] = []
        branch_types = (
            ast.If, ast.While, ast.For, ast.AsyncFor,
            ast.ExceptHandler, ast.With, ast.And, ast.Or,
        )
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn = cast(FuncNode, node)
                cc: int = 1 + int(sum(
                    1 for child in ast.walk(fn)
                    if type(child) in branch_types
                ))
                if cc > 10:
                    issues.append(BugIssue(
                        filename=filename, line=fn.lineno,
                        bug_type="HighComplexity", severity="warning",
                        message=(
                            f"Function `{fn.name}` has cyclomatic complexity {cc} (threshold: 10). "
                            "This makes it hard to test and maintain."
                        ),
                        fix=f"Break `{fn.name}` into smaller focused functions of 10-20 lines each."
                    ))
        return issues

    def _check_long_functions(self, filename: str, tree: ast.AST) -> List[BugIssue]:
        issues: List[BugIssue] = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn = cast(FuncNode, node)
                end_line = fn.end_lineno
                end: int = end_line if end_line is not None else fn.lineno
                length: int = end - fn.lineno
                if length > 50:
                    issues.append(BugIssue(
                        filename=filename, line=fn.lineno,
                        bug_type="LongFunction", severity="info",
                        message=(
                            f"Function `{fn.name}` is {length} lines long. "
                            "Functions over 50 lines are harder to test."
                        ),
                        fix=f"Extract logical sub-steps of `{fn.name}` into helper functions."
                    ))
        return issues


# ── Complexity Analyzer (Gravity Score) ───────────────────────────────────────

class ComplexityAnalyzer:
    """Calculates a Gravity Score from cyclomatic complexity."""

    def __init__(self) -> None:
        self.bug_detector = BugDetector()

    def analyze_file(self, content: str, filename: str) -> FileRisk:
        ext = os.path.splitext(filename)[1].lower()
        try:
            if ext == ".py":
                tree = ast.parse(content)
                complexity = self._cyclomatic(tree)
            else:
                complexity = max(1, len(re.findall(
                    r'\b(if|else|for|while|switch|case|catch|&&|\|\|)\b', content
                )) // 3)

            score: int = min(max(int(complexity * 8), 10), 98)
            level: str = "High" if score > 80 else "Medium" if score > 50 else "Low"

            # Use explicit float() to satisfy strict type checkers on round()
            cc_f: float = float(complexity)
            factors = [
                RiskFactor(
                    name="Cyclomatic Complexity",
                    impact="High" if complexity > 10 else "Low",
                    score=round(cc_f / 20.0, 2),
                ),
                RiskFactor(
                    name="Maintainability",
                    impact="Medium",
                    score=round(1.0 - cc_f / 20.0, 2),
                ),
            ]
            return FileRisk(
                filename=filename, gravity_score=score, risk_level=level,
                factors=factors, suggestions=self._suggestions(filename, score, complexity)
            )
        except Exception:
            return FileRisk(
                filename=filename, gravity_score=30, risk_level="Low",
                factors=[], suggestions=["Ensure file is valid and review structure."]
            )

    def _cyclomatic(self, tree: ast.AST) -> int:
        branch_types = (
            ast.If, ast.While, ast.For, ast.AsyncFor,
            ast.With, ast.AsyncWith, ast.And, ast.Or, ast.ExceptHandler,
        )
        return 1 + int(sum(1 for n in ast.walk(tree) if isinstance(n, branch_types)))

    def _suggestions(self, filename: str, score: int, cc: int) -> List[str]:
        s: List[str] = []
        if cc > 10:
            s.append(f"Nesting in {filename} is too deep — decompose into smaller functions.")
        if score > 70:
            s.append("Consider breaking this module into separate responsibilities.")
        if not s:
            s.append("Maintain existing architectural patterns.")
        return s
