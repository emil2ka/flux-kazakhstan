"""Build the offline Russian locale script from its editable JSON source."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'locales/ru.json').read_text())
assert data['strings'] and set(data['programs'])=={'kolsai','charyn','burabay','turkestan','altyn'}
(root/'i18n-ru.js').write_text('/* Generated from locales/ru.json. Local dictionary, no network requests. */\nwindow.FluxLocale = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
print('Built',len(data['strings']),'Russian strings and five itineraries')
