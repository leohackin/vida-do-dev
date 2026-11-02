"""Real HTTP + Canvas smoke test; screenshots are evidence, not visual approval."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from threading import Thread
import json, os, shutil
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent.parent
ENGINE = os.environ.get('BROWSER_ENGINE', 'chromium')
if ENGINE not in ('chromium', 'firefox', 'webkit'):
    raise ValueError(f'Unsupported BROWSER_ENGINE: {ENGINE}')
OUT = BASE / 'artifacts' / ENGINE
OUT.mkdir(parents=True, exist_ok=True)
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
        assert page.evaluate('__officeDebug.images.background.src.endsWith("/assets/office-clean.png")')
        assert page.evaluate('__officeDebug.images.brand.src.endsWith("/assets/reference-original.png")')
        assert page.evaluate('__officeDebug.images.devMove.src.endsWith("/assets/dev-directional.png")')
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
        # Sitting changes depth only while fully hidden; it must never slide a
        # visible body through the furniture between approach point and seat.
        transition = page.evaluate('''()=>{const e=__officeDebug,a=e.actors[0];
          a.x=900;a.y=628;a.slot='lounge:0';a.pose='sit';a.alpha=1;
          const at=t=>{a.transition={kind:'sit',t,duration:.5};return e.seatRenderState(a,true)};
          const result=[at(.1),at(.25),at(.4)];a.transition=null;return result;
        }''')
        assert (transition[0]['x'], transition[0]['y']) == (900, 628)
        assert transition[1]['renderAlpha'] == 0
        assert (transition[2]['x'], transition[2]['y']) == (640, 485)
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
        page.evaluate('''()=>{const e=__officeDebug;const setups=[
          ['guest','desk',0,'type'],['dev','meeting',0,'sit'],
          ['ana','lounge',0,'sit'],['pm','arcade',0,'sit']];
          for(const a of e.actors)a.active=false;
          for(const [id,dest,index,pose] of setups){const a=e.actors.find(v=>v.id===id),p=e.interactionSlots[dest][index];
            a.active=true;a.visible=true;a.walking=false;a.transition=null;a.slot=`${dest}:${index}`;
            a.goal=dest;a.pose=pose;a.x=p[0];a.y=p[1];a.bubble=null;
          }e.render();
        }''')
        page.screenshot(path=str(OUT/'seats.png'),full_page=True)
        page.evaluate('''()=>{const e=__officeDebug;for(const a of e.actors)a.active=false;
          for(const [id,index] of [['guest',0],['dev',1]]){const a=e.actors.find(v=>v.id===id),p=e.interactionSlots.lounge[index];
            a.active=true;a.visible=true;a.walking=false;a.transition=null;a.slot=`lounge:${index}`;
            a.goal='lounge';a.pose='sit';a.x=p[0];a.y=p[1];a.bubble=null;
          }e.render();
        }''')
        page.screenshot(path=str(OUT/'lounge-pair.png'),full_page=True)
        # Review every character against the same furniture geometry. These
        # matrices expose actor-specific padding/anchor defects that a single
        # representative screenshot cannot catch.
        matrix_specs = {
            'lounge': ((525, 330, 875, 610), 'sit'),
            'meeting': ((1040, 235, 1430, 515), 'sit'),
            'desk': ((900, 625, 1300, 910), 'type'),
            'arcade': ((1160, 480, 1510, 770), 'sit'),
        }
        for destination, (source_crop, pose) in matrix_specs.items():
            panels = []
            for actor_id in ['guest', 'dev', 'ana', 'ops', 'pm']:
                page.evaluate('''([actorId,destination,pose])=>{const e=__officeDebug;
                  for(const a of e.actors)a.active=false;
                  const a=e.actors.find(v=>v.id===actorId),p=e.interactionSlots[destination][0];
                  a.active=true;a.visible=true;a.walking=false;a.transition=null;a.slot=`${destination}:0`;
                  a.goal=destination;a.pose=pose;a.x=p[0];a.y=p[1];a.bubble=null;e.render();
                }''', [actor_id, destination, pose])
                scene = Image.open(BytesIO(page.locator('#scene').screenshot())).convert('RGB')
                sx, sy = scene.width / 1536, scene.height / 1024
                x1, y1, x2, y2 = source_crop
                panel = scene.crop((round(x1*sx), round(y1*sy), round(x2*sx), round(y2*sy)))
                ImageDraw.Draw(panel).text((8, 7), actor_id.upper(), fill='white', stroke_width=2, stroke_fill='black')
                panels.append(panel)
            sheet = Image.new('RGB', (sum(p.width for p in panels), max(p.height for p in panels)), '#111')
            offset = 0
            for panel in panels:
                sheet.paste(panel, (offset, 0));offset += panel.width
            sheet.save(OUT/f'visual-matrix-{destination}.png')
        # Frame-by-frame evidence for both directions of the depth switch. The
        # actor may fade, but no visible frame may occupy the space between the
        # safe floor point and the sofa.
        for kind in ['sit', 'stand']:
            panels = []
            for transition_time in [0, .125, .249, .25, .375, .5]:
                page.evaluate('''([kind,t])=>{const e=__officeDebug;for(const a of e.actors)a.active=false;
                  const a=e.actors.find(v=>v.id==='guest'),p=e.interactionSlots.lounge[0];
                  a.active=true;a.visible=true;a.walking=false;a.slot='lounge:0';a.goal='lounge';a.pose='sit';
                  a.x=p[0];a.y=p[1];a.alpha=1;a.bubble=null;a.transition={kind,t,duration:.5};e.render();
                }''', [kind, transition_time])
                scene = Image.open(BytesIO(page.locator('#scene').screenshot())).convert('RGB')
                sx, sy = scene.width / 1536, scene.height / 1024
                panel = scene.crop((round(525*sx), round(330*sy), round(935*sx), round(675*sy)))
                ImageDraw.Draw(panel).text((8, 7), f'{transition_time:.3f}s', fill='white', stroke_width=2, stroke_fill='black')
                panels.append(panel)
            sheet = Image.new('RGB', (sum(p.width for p in panels), max(p.height for p in panels)), '#111')
            offset = 0
            for panel in panels:
                sheet.paste(panel, (offset, 0));offset += panel.width
            sheet.save(OUT/f'transition-lounge-{kind}.png')
        for destination in ['meeting', 'desk']:
            page.evaluate('''destination=>{const e=__officeDebug;for(const a of e.actors)a.active=false;
              for(const [id,index] of [['guest',0],['dev',1]]){const a=e.actors.find(v=>v.id===id),p=e.interactionSlots[destination][index];
                a.active=true;a.visible=true;a.walking=false;a.transition=null;a.slot=`${destination}:${index}`;
                a.goal=destination;a.pose='idle';a.x=p[0];a.y=p[1];a.bubble=null;
              }e.render();
            }''', destination)
            page.screenshot(path=str(OUT/f'approaches-{destination}.png'),full_page=True)
        page.evaluate('''()=>{const e=__officeDebug;for(const a of e.actors)a.active=false;
          const dev=e.actors.find(a=>a.id==='dev');dev.active=true;dev.visible=true;dev.walking=false;dev.transition=null;
          dev.x=760;dev.y=610;dev.slot=null;dev.goal='coffee';dev.pose='coffee';dev.bubble=null;e.render();
        }''')
        page.screenshot(path=str(OUT/'dev-interaction.png'),full_page=True)
        page.evaluate('window.requestAnimationFrame=()=>0')
        page.wait_for_timeout(100)
        page.evaluate('''()=>{const e=__officeDebug;
          for(const a of e.actors)a.active=false;
          e.render();const dev=e.actors.find(a=>a.id==='dev');dev.active=true;dev.visible=true;
          dev.walking=true;dev.transition=null;dev.motionTime=.18;
          [[610,390,0],[770,390,1],[930,390,2],[1090,390,3]].forEach(([x,y,facing])=>{
            dev.x=x;dev.y=y;dev.facing=facing;e.imgDraw(dev);
          });
        }''')
        page.screenshot(path=str(OUT/'dev-directions.png'),full_page=True)
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
        assert timings[114] < 20, f'Canvas render p95 exceeded budget: {timings[114]:.2f} ms'
        report={'engine':ENGINE,'browser':browser.version,'functional_cases':35,
                'raf_journey':True,'pause_resume':True,'page_errors':errors,
                'render_ms_median':timings[60],'render_ms_p95':timings[114],
                'render_budget_ms_p95':20}
        if (BASE / 'tools/art_review.html').exists():
            from build_art_review import build
            export = build()
            review = browser.new_page(viewport={'width':1200,'height':1000})
            review_errors, requests = [], []
            review.on('pageerror', lambda e: review_errors.append(str(e)))
            url = f'http://127.0.0.1:{server.server_port}/isolated-review.html'
            def isolated(route):
                requests.append(route.request.url)
                if route.request.url == url:
                    route.fulfill(path=str(export), content_type='text/html')
                else:
                    route.abort()
            # Only the HTML is available. Sidecars and image URLs cannot resolve.
            review.route('**/*', isolated)
            review.goto(url)
            review.wait_for_selector('body[data-ready="true"]')
            review.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
            assert review.locator('canvas').count() == 4
            review.locator('#frame').fill('2')
            review.locator('#frame').dispatch_event('input')
            assert review.locator('#counter').inner_text() == '3 / 4'
            review.locator('#compare').fill('25')
            review.locator('#compare').dispatch_event('input')
            assert review.locator('.candidate').evaluate('(i)=>i.style.clipPath') == 'inset(0px 0px 0px 25%)'
            assert review.locator('#error').inner_text() == ''
            assert requests == [url], requests
            assert not review_errors, review_errors
            review.screenshot(path=str(OUT/'art-review-standalone.png'), full_page=True)
            report['standalone_art_review'] = True
            review.close()
        (OUT/'browser-results.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
        browser.close()
finally:
    server.shutdown()
