import json
from functools import lru_cache
from pathlib import Path


@lru_cache
def get_policy() -> dict:
    path = Path(__file__).resolve().parent.parent / "policies" / "standard-maintenance-policy.v1.json"
    policy = json.loads(path.read_text(encoding="utf-8"))
    if policy.get("policy_version") != "1.0" or len(policy.get("classifications", [])) != 2:
        raise RuntimeError("The standard maintenance policy is invalid.")
    return policy
