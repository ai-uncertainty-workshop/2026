'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const scale = 300 / 25.4;
  const badgeWidth = 70, badgeHeight = 105, bleed = 3;
  const artWidth = badgeWidth + bleed * 2, artHeight = badgeHeight + bleed * 2;
  const sample = { id: 'sample', firstName: 'Alex', surname: 'Morgan', name: 'Alex Morgan', affiliation: 'University name', role: 'Attendee' };
  let nextAttendeeId = 0;
  let assets, ready = false;
  const image = src => new Promise((resolve, reject) => {
    const embedded = window.BADGE_ASSETS?.[src];
    if (!embedded) { reject(new Error('Badge images are missing. Please include badges-assets.js alongside this page')); return; }
    const img = new Image(); img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + src)); img.src = embedded;
  });
  function attendees() {
    return [...$('attendees').querySelectorAll('.attendee-card')].flatMap((card, i) => {
      const person = Object.fromEntries([...card.querySelectorAll('input')].map(input => [input.dataset.field, input.value.trim()]));
      if (!Object.values(person).some(Boolean)) return [];
      if (!person.firstName) throw new Error(`Attendee ${i + 1}: please enter a first name.`);
      if (Object.values(person).some(value => value.length > 180)) throw new Error(`Attendee ${i + 1}: please shorten fields to 180 characters or fewer.`);
      return [{ ...person, id: card.dataset.id, name: [person.firstName, person.surname].filter(Boolean).join(' '), role: person.role || 'Attendee' }];
    });
  }
  function addAttendee(focus = true) {
    const card = $('attendee-template').content.firstElementChild.cloneNode(true);
    card.dataset.id = String(++nextAttendeeId);
    card.querySelectorAll('input').forEach(input => {
      input.id = `attendee-${card.dataset.id}-${input.dataset.field}`;
      card.querySelector(`[data-label="${input.dataset.field}"]`).htmlFor = input.id;
    });
    $('attendees').append(card);
    numberAttendees();
    if (focus) card.querySelector('input').focus();
    update();
  }
  function numberAttendees() {
    $('attendees').querySelectorAll('.attendee-card').forEach((card, i) => {
      card.querySelector('legend').textContent = `Attendee ${i + 1}`;
      card.querySelector('button').setAttribute('aria-label', `Remove attendee ${i + 1}`);
    });
  }
  function lines(ctx, text, width) {
    const result = []; let line = '';
    // Split long unbroken words as well as ordinary names and affiliations.
    for (const word of text.split(/\s+/)) {
      if (line && ctx.measureText(line + ' ' + word).width > width) { result.push(line); line = ''; }
      for (const char of Array.from((line ? ' ' : '') + word)) {
        if (ctx.measureText(line + char).width > width) { result.push(line); line = ''; }
        line += char;
      }
    }
    if (line) result.push(line);
    return result;
  }
  function fitText(ctx, text, y, height, startSize, family, weight, color, width = badgeWidth - 12) {
    let size = startSize, wrapped;
    do {
      ctx.font = `${weight} ${size}px ${family}`;
      wrapped = lines(ctx, text, width);
      if (wrapped.length * size * 1.2 <= height) break;
      size -= .2;
    } while (size >= 2.4);
    if (wrapped.length * size * 1.2 > height) throw new Error('A badge field is too long to fit. Please shorten it.');
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    wrapped.forEach((line, i) => ctx.fillText(line, badgeWidth / 2, y + height / 2 + (i - (wrapped.length - 1) / 2) * size * 1.2));
  }
  function badge(person) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(artWidth * scale); canvas.height = Math.ceil(artHeight * scale);
    const ctx = canvas.getContext('2d'); ctx.scale(canvas.width / artWidth, canvas.height / artHeight); ctx.translate(bleed, bleed);
    ctx.fillStyle = '#fbf7f0'; ctx.fillRect(-bleed, -bleed, artWidth, artHeight);
    const hero = assets[0], ratio = Math.max(artWidth / hero.width, 33 / hero.height);
    ctx.save(); ctx.beginPath(); ctx.rect(-bleed,-bleed,artWidth,33); ctx.clip();
    ctx.drawImage(hero, badgeWidth / 2 - hero.width * ratio / 2, -bleed, hero.width * ratio, hero.height * ratio);
    ctx.fillStyle = '#004d5a99'; ctx.fillRect(-bleed,-bleed,artWidth,33); ctx.restore();
    fitText(ctx, 'MAURITIUS · 2026', 3, 4, 2.5, 'Jost, Arial', '600', '#ffffff');
    fitText(ctx, 'AI, Uncertainty', 9, 8, 6.5, '"Cormorant Garamond", Georgia', '600', '#ffffff');
    fitText(ctx, '& Simulation', 18, 8, 6.5, '"Cormorant Garamond", Georgia', '400', '#fff9e6');
    ctx.fillStyle = '#00b8d4'; ctx.fillRect(-bleed,30,artWidth,1.2);
    fitText(ctx, person.firstName, 32, 14, 11, 'Jost, Arial', '600', '#d65a00');
    fitText(ctx, person.surname, 47, 8, 6, 'Jost, Arial', '400', '#004d5a');
    fitText(ctx, person.affiliation, 56, 7, 3.8, 'Jost, Arial', '400', '#004d5a');
    fitText(ctx, person.role.toUpperCase(), 64, 5, 3, 'Jost, Arial', '600', '#006064');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 70, 58, 10);
    ctx.font = '400 3px Jost, Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#006064'; ctx.fillText('Hobbies', 8, 75);
    ctx.strokeStyle = '#96bfc4'; ctx.lineWidth = .25;
    ctx.beginPath(); ctx.moveTo(25, 77); ctx.lineTo(62, 77); ctx.stroke();
    ctx.fillStyle = '#b77a3e'; ctx.fillRect(25,81,20,.35);
    fitText(ctx, '16–20 November 2026', 81.5, 4, 2.6, 'Jost, Arial', '400', '#004d5a');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-bleed,86,artWidth,22);
    const slots = [[5,20],[28,16],[47,18]];
    assets.slice(1).forEach((img,i) => {
      const [x,w] = slots[i], r = Math.min(w / img.width, 4 / img.height);
      ctx.drawImage(img,x+(w-img.width*r)/2,87+(4-img.height*r)/2,img.width*r,img.height*r);
    });
    fitText(ctx, 'Emergency contact: Nadeem', 93, 3.4, 2.7, 'Jost, Arial', '600', '#004d5a');
    fitText(ctx, 'WhatsApp: +27765041029', 96.4, 3.4, 2.7, 'Jost, Arial', '400', '#004d5a');
    fitText(ctx, '+23052565554', 99.8, 3.4, 2.7, 'Jost, Arial', '400', '#004d5a');
    return canvas;
  }
  function update(preferredId) {
    if (!ready) return;
    try {
      const people = attendees(), old = preferredId || $('preview-select').value;
      const previews = people.length ? people : [sample];
      $('preview-select').replaceChildren(...previews.map(p => new Option(p.name, p.id)));
      const p = previews.find(person => person.id === old) || previews[0];
      $('preview-select').value = p.id;
      const art = badge(p), preview = $('preview'); preview.width = Math.round(badgeWidth*scale); preview.height = Math.round(badgeHeight*scale);
      preview.getContext('2d').drawImage(art,bleed/artWidth*art.width,bleed/artHeight*art.height,badgeWidth/artWidth*art.width,badgeHeight/artHeight*art.height,0,0,preview.width,preview.height);
      preview.setAttribute('aria-label', `Front and back badge for ${p.name}, ${p.affiliation}, ${p.role}, with a blank line to write hobbies. Emergency contact: Nadeem. WhatsApp: +27765041029. Additional number: +23052565554.`);
      $('download').disabled = false;
      $('download').textContent = people.length ? 'Download print PDF' : 'Download sample PDF';
      $('status').textContent = people.length ? `${people.length} badge${people.length === 1 ? '' : 's'} ready.` : 'Download the sample, or enter attendee details to create your badges.';
    } catch (e) { $('status').textContent = e.message; $('download').disabled = true; }
  }
  const pt = mm => (mm * 72 / 25.4).toFixed(4);
  // Small binary PDF writer: the exact preview artwork is embedded at 300 dpi.
  // All offsets are byte offsets; text is rasterised, preserving accented names.
  function makePDF(artworks, format) {
    const folded = format === 'fold', a4 = format === 'a4', sheet = folded || a4;
    const enc = new TextEncoder(), objects = [null,null], pageIDs = [];
    const add = content => { objects.push(typeof content === 'string' ? enc.encode(content) : content); return objects.length; };
    const join = parts => { const out = new Uint8Array(parts.reduce((n,p)=>n+p.length,0)); let at=0; parts.forEach(p=>{out.set(p,at);at+=p.length;}); return out; };
    const stream = (dict, data) => join([enc.encode(`<< ${dict} /Length ${data.length} >>\nstream\n`),data,enc.encode('\nendstream')]);
    const images = artworks.map(c => {
      const bytes = Uint8Array.from(atob(c.toDataURL('image/jpeg', .98).split(',')[1]), c => c.charCodeAt(0));
      return add(stream(`/Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,bytes));
    });
    const width = sheet ? 210 : badgeWidth + 12, height = sheet ? 297 : badgeHeight + 12, perSheet = a4 ? 2 : 1;
    for (let start=0;start<images.length;start+=perSheet) {
      let drawing = '', resources = '';
      for (let slot=0;slot<perSheet && start+slot<images.length;slot++) {
        const x=(width-badgeWidth)/2;
        const y=folded ? (height-2*badgeHeight)/2 : a4 ? (height-(2*badgeHeight+12))/2+slot*(badgeHeight+12) : 6;
        if (folded) {
          // Clip bleed at the shared fold. Rotate the lower copy by 180 degrees.
          // Both trimmed panels meet at y + badgeHeight, with no gap or overlapping bleed.
          drawing += `q ${pt(x-3)} ${pt(height-y-badgeHeight)} ${pt(artWidth)} ${pt(badgeHeight+bleed)} re W n ${pt(artWidth)} 0 0 ${pt(artHeight)} ${pt(x-3)} ${pt(height-y-badgeHeight-bleed)} cm /Im${slot} Do Q\n`;
          drawing += `q ${pt(x-3)} ${pt(height-y-2*badgeHeight-bleed)} ${pt(artWidth)} ${pt(badgeHeight+bleed)} re W n -${pt(artWidth)} 0 0 -${pt(artHeight)} ${pt(x+badgeWidth+bleed)} ${pt(height-y-badgeHeight+bleed)} cm /Im${slot} Do Q\n`;
        } else {
          drawing += `q ${pt(artWidth)} 0 0 ${pt(artHeight)} ${pt(x-3)} ${pt(height-y-badgeHeight-bleed)} cm /Im${slot} Do Q\n`;
        }
        resources += `/Im${slot} ${images[start+slot]} 0 R `;
        drawing += '0 G 0.3 w\n';
        const line=(x1,y1,x2,y2)=>`${pt(x1)} ${pt(height-y1)} m ${pt(x2)} ${pt(height-y2)} l S\n`;
        const cutHeight = folded ? 2*badgeHeight : badgeHeight;
        for (const cy of [y,y+cutHeight]) { drawing+=line(x-5,cy,x-3.5,cy)+line(x+badgeWidth+3.5,cy,x+badgeWidth+5,cy); }
        for (const cx of [x,x+badgeWidth]) { drawing+=line(cx,y-5,cx,y-3.5)+line(cx,y+cutHeight+3.5,cx,y+cutHeight+5); }
        if (folded) {
          drawing += '[3 2] 0 d\n' + line(x-16,y+badgeHeight,x-4,y+badgeHeight) + line(x+badgeWidth+4,y+badgeHeight,x+badgeWidth+16,y+badgeHeight) + '[] 0 d\n';
        }
      }
      const content = add(stream('',enc.encode(drawing)));
      // Two identical pages per sheet; vertically stacked badges keep long-edge duplex alignment.
      for (let side=0;side<(folded ? 1 : 2);side++) {
        const boxes = sheet ? '' : `/TrimBox [${pt(6)} ${pt(6)} ${pt(badgeWidth+6)} ${pt(badgeHeight+6)}] /BleedBox [${pt(3)} ${pt(3)} ${pt(badgeWidth+9)} ${pt(badgeHeight+9)}]`;
        pageIDs.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt(width)} ${pt(height)}] ${boxes} /Resources << /XObject << ${resources} >> >> /Contents ${content} 0 R >>`));
      }
    }
    objects[0]=enc.encode(`<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None /Duplex /${folded ? 'Simplex' : 'DuplexFlipLongEdge'} >> >>`);
    objects[1]=enc.encode(`<< /Type /Pages /Count ${pageIDs.length} /Kids [${pageIDs.map(id=>`${id} 0 R`).join(' ')}] >>`);
    const chunks=[enc.encode('%PDF-1.4\n')], offsets=[0]; let length=chunks[0].length;
    objects.forEach((obj,i)=>{ offsets.push(length); const chunk=join([enc.encode(`${i+1} 0 obj\n`),obj,enc.encode('\nendobj\n')]);chunks.push(chunk);length+=chunk.length; });
    chunks.push(enc.encode(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`));
    return new Blob(chunks,{type:'application/pdf'});
  }
  $('attendees').addEventListener('input', event => update(event.target.closest('.attendee-card').dataset.id));
  $('attendees').addEventListener('click', event => {
    const remove = event.target.closest('.remove-attendee');
    if (!remove) return;
    const card = remove.closest('.attendee-card');
    const neighbour = card.nextElementSibling || card.previousElementSibling;
    card.remove();
    if (!$('attendees').children.length) addAttendee();
    else { numberAttendees(); update(); neighbour.querySelector('input').focus(); }
  });
  $('add-attendee').addEventListener('click', () => addAttendee());
  $('preview-select').addEventListener('change', () => update());
  addAttendee(false);
  function layoutHelp() {
    const descriptions = {
      fold: 'One A4 sheet per attendee: front on top, upside-down back below. Print single-sided at 100%, one page per sheet. Crease at the dashed side guides, cut the outer crop marks, and fold with the artwork facing out. Finished size: 70 × 105 mm.',
      a4: 'A4 portrait, two badges stacked vertically. Alternating front/back sheets, including a matching blank position for odd attendee counts. Print at actual size, flip on the long edge.',
      artwork: '82 × 117 mm pages with a 70 × 105 mm trim box, 3 mm bleed and crop marks. Page order: attendee 1 front, attendee 1 back, attendee 2 front, attendee 2 back…'
    };
    $('layout-help').textContent = descriptions[$('format').value];
  }
  $('format').addEventListener('change', layoutHelp); layoutHelp();
  $('download').addEventListener('click', async () => {
    $('download').disabled=true;
    try {
      const entered=attendees(), people=entered.length ? entered : [sample];
      const artworks=[];
      for(let i=0;i<people.length;i++) {
        $('status').textContent=`Preparing badge ${i+1} of ${people.length}…`;
        await new Promise(resolve=>setTimeout(resolve,0)); artworks.push(badge(people[i]));
      }
      const format=$('format').value, blob=makePDF(artworks,format), url=URL.createObjectURL(blob);
      const suffix = { fold: 'a4-cut-and-fold', a4: 'a4-duplex', artwork: 'print-artwork' }[format];
      const link=document.createElement('a'); link.href=url;link.download=`mauritius-2026-badges-${suffix}.pdf`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      $('status').textContent=`PDF downloaded: ${people.length} badge${people.length===1?'':'s'}.${format === 'fold' ? ' Print single-sided at 100% and fold.' : ''}`;
    } catch(e) { $('status').textContent=`Unable to create PDF: ${e.message}`; }
    finally { $('download').disabled=false; }
  });
  Promise.all([
    Promise.all(['mauritius-hero.jpg','Imperial_College_London_new_logo.png','MIND logo-02.png','UKRI-Logo_Horiz-RGB.png'].map(image)),
    Promise.all(['600 32px Jost','400 32px Jost','600 32px "Cormorant Garamond"','400 32px "Cormorant Garamond"'].map(font=>document.fonts.load(font))).catch(()=>[])
  ]).then(([loaded])=>{assets=loaded;ready=true;update();}).catch(e=>{ $('status').textContent=e.message+'. Reload the page to try again.'; });
})();
