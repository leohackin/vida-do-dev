"""Real HTTP + Canvas smoke test; screenshots are evidence, not visual approval."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json, os, shutil
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent.parent
ENGINE = os.environ.get('BROWSER_ENGINE', 'chromium')
if ENGINE not in ('chromium', 'firefox', 'webkit'):
    raise ValueError(f'Unsupported BROWSER_ENGINE: {ENGINE}')
OUT = BASE / 'artifacts' / ENGINE
OUT.mkdir(exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(BASE)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        executable = os.environ.get('BROWSER_EXECUTABLE')
        if ENGINE == 'chromium':
            executable = executable or shutil.which('chromium')
        browser = getattr(p, ENGINE).launch(headless=True, executable_path=executable, timeout=45000,
                                           args=['--no-sandbox'] if ENGINE == 'chromium' else [])
        page = browser.new_page(viewport={'width':1536,'height':1200}, reduced_motion='reduce')
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/')
        page.wait_for_function('Object.values(__officeDebug.images).every(i=>i.complete&&i.naturalWidth>0)')
        page.wait_for_timeout(1700)  # Let the introduction timer run before deterministic simulation.
        page.locator('#timeMode').select_option('morning')
        page.locator('#season').select_option('normal')
        page.evaluate('''()=>{const e=__officeDebug;e.state.running=false;e.state.eventTimer=Infinity;e.state.spawnTimer=Infinity;}''')
        page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
        # Real selectors and handlers, including the new character.
        page.locator('#character').select_option('pm')
        page.locator('[data-dest="meeting"]').click()
        assert page.evaluate('__officeDebug.actors.find(a=>a.id==="pm").goal') == 'meeting'
        page.locator('#markers').click()
        assert page.evaluate('__officeDebug.state.markers')
        page.locator('#zoomIn').click()
        assert page.locator('#zoomLabel').inner_text() == '120%'
        page.locator('#resetZoom').click()
        # Exercise the actual RAF clock and pause handler before fast-forwarding routes.
        page.evaluate('''()=>{const e=__officeDebug;
          for(const a of e.actors){a.active=false;e.slots.release(a.id);e.cancelQueue(a.id);}
          const a=e.actors[0];e.sendTo(a,'desk');e.state.running=true;
        }''')
        before = page.evaluate('({x:__officeDebug.actors[0].x,y:__officeDebug.actors[0].y})')
        page.wait_for_function('''p=>{const a=__officeDebug.actors[0];
          return Math.hypot(a.x-p.x,a.y-p.y)>10;}''', arg=before)
        page.locator('#pause').click()
        assert not page.evaluate('__officeDebug.state.running')
        frozen = page.evaluate('JSON.stringify(__officeDebug.actors)')
        page.wait_for_timeout(250)
        assert page.evaluate('JSON.stringify(__officeDebug.actors)') == frozen, 'pause changed actors'
        page.locator('#pause').click()
        page.wait_for_function('!__officeDebug.actors[0].walking', timeout=15000)
        page.locator('#pause').click()
        assert page.evaluate('__officeDebug.actors[0].pose') == 'type'
        # Walk each actor through all destinations in the real engine, rendering every arrival.
        page.evaluate('''()=>{
          const e=__officeDebug;e.state.running=true;
          for(const a of e.actors){e.slots.release(a.id);a.active=false;}
          for(const a of e.actors)for(const dest of Object.keys(e.destinations)){
            for(const o of e.actors)if(o!==a){o.active=false;e.slots.release(o.id);e.cancelQueue(o.id);}
            if(!e.sendTo(a,dest))throw Error(`request failed ${a.id}:${dest}`);
            for(let i=0;i<4000&&a.walking;i++)e.tick(.08);
            if(a.walking)throw Error(`arrival failed ${a.id}:${dest}`);
            e.tick(.08);e.render();
          }
          e.state.running=false;
        }''')
        # Inspect all existing sheets/poses together, without timer randomness.
        page.evaluate('''()=>{const e=__officeDebug;let i=0;
         for(const a of e.actors){a.active=true;a.visible=true;a.walking=false;a.transition=null;a.wait=Infinity;a.bubble=null;
          [a.x,a.y]=[[600,350],[900,628],[888,744],[1050,506],[1090,604]][i];
          a.pose=['coffee','sit','type','idle','walk'][i++];}e.render();}''')
        page.screenshot(path=str(OUT/'actors.png'),full_page=True)
        page.evaluate('''()=>{const e=__officeDebug;const c=document.getElementById('scene').getContext('2d');
          for(const [poly,col] of [[e.floor.boundary,'#00ff88'],...e.floor.obstacles.map(p=>[p,'#ff2233'])]){
           c.beginPath();poly.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.strokeStyle=col;c.lineWidth=3;c.stroke();}
        }''')
        # Stop RAF from repainting the debug overlay before the screenshot.
        page.evaluate('window.requestAnimationFrame=()=>0')
        page.wait_for_timeout(100)
        page.evaluate('''()=>{const e=__officeDebug,c=document.getElementById('scene').getContext('2d');
         for(const [poly,col] of [[e.floor.boundary,'#00ff88'],...e.floor.obstacles.map(p=>[p,'#ff2233'])]){
          c.beginPath();poly.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.strokeStyle=col;c.lineWidth=3;c.stroke();}}''')
        page.screenshot(path=str(OUT/'floor-map.png'),full_page=True)
        page.evaluate('__officeDebug.render()')
        for mode in ['sunset','night']:
            page.locator('#timeMode').select_option(mode)
            page.evaluate('__officeDebug.render()')
            page.screenshot(path=str(OUT/f'{mode}.png'),full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'mobile overflow'
        assert not errors, errors
        # Rendering measurement includes software Canvas on this machine only.
        timings=page.evaluate('''()=>{const t=[];for(let i=0;i<120;i++){
         const start=performance.now();__officeDebug.render();t.push(performance.now()-start);}return t.sort((a,b)=>a-b);}''')
        report={'engine':ENGINE,'browser':browser.version,'functional_cases':35,
                'raf_journey':True,'pause_resume':True,'page_errors':errors,
                'render_ms_median':timings[60],'render_ms_p95':timings[114]}
        (OUT/'browser-results.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
        browser.close()
finally:
    server.shutdown()
