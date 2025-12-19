import re
import pathlib

out = []
for p in pathlib.Path("src").rglob("*.ts*"):
    try:
        t = p.read_text(encoding="utf-8", errors="ignore")
    except:
        continue
    
    if re.search(r"^[\"']use client[\"']", t, re.M):
        imps = re.findall(r"from ['\"](@/[^'\"]+|\.{1,2}/[^'\"]+)['\"]", t)
        risky = [i for i in imps if i.startswith("@/lib") or i.startswith("@/modules")]
        if risky:
            out.append(f"{p} :: {', '.join(risky)}")

pathlib.Path("audit/02d_client_imports_risky.txt").write_text("\n".join(out), encoding="utf-8")
print(f"wrote audit/02d_client_imports_risky.txt with {len(out)} entries")
