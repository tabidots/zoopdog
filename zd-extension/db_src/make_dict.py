#!/usr/bin/python

import codecs
import json
import re

def main():
    res = []
    f = codecs.open('vnedict.txt', encoding='utf-8')
    for line in f:
        entry = {
            "vn": u"",
            "en": []
        }
        if line.startswith("#"):
            continue
        if not ":" in line:
            continue
        entry['vn'] = line.split(":")[0].strip().encode('utf8')
        en_defs = line.split(":")[1].strip().encode('utf8')
        for definition in en_defs.split(";"):
            trimmed_def = re.sub(r'\(\d+\)', '', definition).strip()
            entry['en'].append({
                "def": trimmed_def,
                "pos": u"verb" if trimmed_def.startswith("to ") else u""
            })
        res.append(entry)
    with open('vnedict.json', 'w') as outfile:
        json.dump(res, outfile, sort_keys = True, indent = 4, ensure_ascii = False)

if __name__ == '__main__':
  main()
