import sys, re
path = sys.argv[1]
t = open(path).read()
print("books", "Books" in t)
print("strategies", "Strategies" in t)
print("later-race", "Later-race" in t or "Later-race P&L" in t)
print("mill_clutter", "Mill clutter" in t)
print("square", "WIN beside PLACE" in t)
print("keep_tile", "KEEP" in t)
# check JS bundle has officeBookRows
m = re.search(r'officeBookRows|Later-race P&L', t)
print("bundle_hint", bool(m))
