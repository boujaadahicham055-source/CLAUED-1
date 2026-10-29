import sys, json, zipfile, re, shutil
src, kinds_path = sys.argv[1], sys.argv[2]
kinds = json.load(open(kinds_path))
tmp = src + ".tmp"
TR = {
  # Dividers/cover: fade through black (cinematic); articles: smooth slow fade
  "cover": '<p:transition spd="slow"><p:fade thruBlk="1"/></p:transition>',
  "divider": '<p:transition spd="slow"><p:fade thruBlk="1"/></p:transition>',
  "article": '<p:transition spd="slow"><p:fade/></p:transition>',
}
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zo:
    for item in zi.infolist():
        data = zi.read(item.filename)
        m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
        if m:
            x = data.decode("utf-8")
            t = TR[kinds[int(m.group(1)) - 1]]
            x = re.sub(r"<p:transition\b.*?(</p:transition>|/>)", "", x, flags=re.S)
            if "</p:clrMapOvr>" in x:
                x = x.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + t, 1)
            else:
                x = x.replace("</p:cSld>", "</p:cSld>" + t, 1)
            data = x.encode("utf-8")
        zo.writestr(item, data)
shutil.move(tmp, src)
print("transitions added")
