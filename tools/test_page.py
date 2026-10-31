from playwright.sync_api import sync_playwright
from pathlib import Path
import base64,re
base=Path(__file__).parent.parent
html=(base/'index.html').read_text();css=(base/'style.css').read_text();js=(base/'office.js').read_text()
for path in (base/'assets').glob('*.png'):
 uri='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
 js=js.replace('assets/'+path.name,uri)
html=html.replace('<script src="navigation.js"></script>','<script>'+(base/'navigation.js').read_text()+'</script>')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<script src="office.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1536,'height':1200},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda ex:errors.append(str(ex)));page.on('console',lambda x:errors.append('console: '+x.text) if x.type=='error' else None)
 page.set_content(html,wait_until='domcontentloaded');page.wait_for_timeout(2400)
 print('imgs',page.evaluate('Object.fromEntries(Object.entries(window.__officeDebug.images).map(([k,v])=>[k,[v.naturalWidth,v.naturalHeight,v.complete]]))'))
 print('errors',errors)
 print('state initial',page.evaluate('window.__officeDebug.actors.map(a=>({id:a.id,x:a.x,y:a.y,goal:a.goal,route:a.route.length}))'))
 page.screenshot(path=str(base/'preview.png'),full_page=True)
 page.locator('#timeMode').select_option('sunset');page.wait_for_timeout(200);page.screenshot(path=str(base/'preview-sunset.png'),full_page=True)
 page.locator('[data-dest="arcade"]').click();page.wait_for_timeout(2000)
 print('actor',page.evaluate('(()=>{let a=window.__officeDebug.actors.find(x=>x.id===window.__officeDebug.state.selected);return {name:a.id,goal:a.goal,walk:a.walking,x:a.x,y:a.y}})()'))
 page.locator('#surprise').click();page.wait_for_timeout(500);print('event',page.locator('#eventName').inner_text())
 page.locator('#markers').click();print('markers',page.evaluate('window.__officeDebug.state.markers'))
 page.locator('#pause').click();print('running',page.evaluate('window.__officeDebug.state.running'))
 page.locator('#pause').click();page.locator('#timeMode').select_option('night');page.wait_for_timeout(300)
 page.screenshot(path=str(base/'preview-night.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(250);page.screenshot(path=str(base/'preview-mobile.png'),full_page=True)
 print('errors end',errors)
 browser.close()
