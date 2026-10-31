from playwright.sync_api import sync_playwright
from pathlib import Path
import base64
base=Path(__file__).resolve().parent.parent
html=(base/'index.html').read_text();js=(base/'office.js').read_text();css=(base/'style.css').read_text()
for f in (base/'assets').glob('*.png'):
 if 'assets/'+f.name in js:js=js.replace('assets/'+f.name,'data:image/png;base64,'+base64.b64encode(f.read_bytes()).decode())
html=html.replace('<script src="navigation.js"></script>','<script>'+(base/'navigation.js').read_text()+'</script>')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<script src="office.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1200});page.set_content(html);page.wait_for_timeout(700)
 page.evaluate("""()=>{let d=window.__officeDebug.actors[0];d.x=1268;d.y=626;d.goal='arcade';d.pose='sit';d.walking=false;d.active=true;d.bubble={text:'pause no deploy',t:5};}""")
 page.locator('#timeMode').select_option('sunset');page.wait_for_timeout(200)
 page.screenshot(path=str(base/'preview-sitting.png'),full_page=True)
 b.close()
