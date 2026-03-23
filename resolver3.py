import re

def resolve_file(filepath):
    with open(filepath, "r") as f:
        lines = f.readlines()

    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("<<<<<<< Updated upstream"):
            upstream = []
            i += 1
            while not lines[i].startswith("======="):
                upstream.append(lines[i])
                i += 1
            stashed = []
            i += 1
            while not lines[i].startswith(">>>>>>> Stashed changes"):
                stashed.append(lines[i])
                i += 1

            # Since the only conflict is from the docs/minor refactor, we just keep our stashed changes (which are the bolt changes + the upstream changes basically, but bolt modified them)
            # Actually wait, let's look at the conflicts.
            out_lines.append("<<<<< CONFLICT\n")
            out_lines.extend(upstream)
            out_lines.append("=====\n")
            out_lines.extend(stashed)
            out_lines.append(">>>>>\n")
        else:
            out_lines.append(line)
        i += 1

    with open(filepath, "w") as f:
        f.writelines(out_lines)

resolve_file("app/src/lib/utils.ts")
resolve_file("app/src/components/HorariosModal.tsx")
resolve_file("app/src/components/LineCard.tsx")
