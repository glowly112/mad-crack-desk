import sys, re
path = sys.argv[1]
t = open(path).read()
words = re.sub(r"<script[^>]*>.*?</script>", "", t, flags=re.S)
if "office" in path:
    print("office", "Office" in t)
    print("mill_clutter", "Mill clutter" in t)
    print("skipped", "Skipped / off tape" in t)
    print("square", "WIN beside PLACE" in t)
    print("still_tested", "Still being tested" in t)
    print("whos_working", "Who's working" in t)
elif "staff" in path:
    print("staff", "Staff" in t)
    print("watching", "Who is watching" in t)
    print("igor", "Igor" in t)
    print("hops", "Recent hops" in t)
else:
    print("sparse", "sparse OK" in t)
    print("back", "BACK" in t and "LAY" in t)
    m = re.search(r"(\d+) empty of (\d+)", re.sub("<[^>]+>", " ", words))
    print("empty", m.groups() if m else None)
