"""
Minimal MySQL dump reader.

Parses `INSERT INTO `tbl` VALUES (...),(...);` extended-insert statements
into Python rows, handling backslash escapes and quoted strings properly.
"""
import re, io


def _column_names(sql_text, table):
    m = re.search(
        r"CREATE TABLE `%s` \((.*?)\n\) ENGINE" % re.escape(table),
        sql_text, re.S)
    if not m:
        return None
    cols = []
    for line in m.group(1).split("\n"):
        line = line.strip()
        cm = re.match(r"`([^`]+)`\s", line)
        if cm:
            cols.append(cm.group(1))
    return cols


def _split_tuples(payload):
    """Yield lists of raw field values from `(a,b),(c,d)` payload."""
    i, n = 0, len(payload)
    row, field = [], io.StringIO()
    in_str = False
    depth = 0

    while i < n:
        ch = payload[i]

        if in_str:
            if ch == "\\":                       # escape sequence
                nxt = payload[i + 1] if i + 1 < n else ""
                field.write({"n": "\n", "t": "\t", "r": "\r",
                             "0": "\0", "\\": "\\", "'": "'",
                             '"': '"'}.get(nxt, nxt))
                i += 2
                continue
            if ch == "'":
                if i + 1 < n and payload[i + 1] == "'":   # '' -> literal '
                    field.write("'")
                    i += 2
                    continue
                in_str = False
                i += 1
                continue
            field.write(ch)
            i += 1
            continue

        if ch == "'":
            in_str = True
            i += 1
            continue
        if ch == "(":
            depth += 1
            if depth == 1:
                row, field = [], io.StringIO()
                i += 1
                continue
        if ch == ")":
            depth -= 1
            if depth == 0:
                row.append(field.getvalue())
                yield row
                row, field = [], io.StringIO()
                i += 1
                continue
        if ch == "," and depth == 1:
            row.append(field.getvalue())
            field = io.StringIO()
            i += 1
            continue

        if depth >= 1:
            field.write(ch)
        i += 1


def read_table(path, table):
    """Return (columns, rows) for `table` in the dump at `path`."""
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = fh.read()

    cols = _column_names(text, table)
    rows = []

    for m in re.finditer(
            r"INSERT INTO `%s` VALUES " % re.escape(table), text):
        start = m.end()
        # statement ends at the first ";\n" following the payload
        end = text.index(";\n", start)
        for raw in _split_tuples(text[start:end]):
            vals = [None if v == "NULL" else v for v in raw]
            rows.append(dict(zip(cols, vals)) if cols else vals)

    return cols, rows


if __name__ == "__main__":
    import sys
    c, r = read_table(sys.argv[1], sys.argv[2])
    print("columns:", c)
    print("rows:", len(r))
