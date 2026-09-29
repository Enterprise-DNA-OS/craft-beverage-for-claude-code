#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
export const reads={
 products:'select code,name,kind,litres_per_unit from products order by code',
 locations:'select code,name,country,licence_ref from locations order by code',
 vessels:'select code,name from vessels order by code',
 customers:'select code,name,email from contacts order by code',
 batches:'select b.code,p.name product,b.produced_on,b.abv,b.status,b.source_ref from batches b join products p on p.id=b.product_id order by b.code',
 stock:'select batch,product,location,status,units,litres,litres_alcohol,age_days from v_stock where units<>0 order by batch,location',
 'dispatch-board':'select code,due_on,customer,location,batch,batch_status,required,available,short_units from v_dispatch order by due_on,code',
 shortages:'select code,batch,required,available,short_units from v_dispatch where short_units>0 order by due_on',
 'cellar-round':'select b.code,v.code vessel,b.status,b.abv,max(a.tested_on) last_analysis,current_date-max(a.tested_on) days_since_analysis from batches b left join vessels v on v.id=b.vessel_id left join analyses a on a.batch_id=b.id group by b.id,v.id order by b.code',
 'stock-age':'select batch,product,location,units,age_days from v_stock where units>0 and age_days>90 order by age_days desc',
 'excise-prep':'select occurred_on,ref,batch,country,movement,litres,abv,litres_alcohol,tax_basis,duty_ref from v_excise_records order by occurred_on,ref',
 'wet-review':"select o.code,c.name customer,o.tax_basis,ol.currency,sum(ol.units*ol.unit_price) recorded_line_value from orders o join contacts c on c.id=o.contact_id join order_lines ol on ol.order_id=o.id where o.tax_basis='AU-WET' group by o.id,c.id,ol.currency order by o.code",
 compliance:'select * from v_compliance order by rule,record',attention:'select * from v_attention order by kind,record',
 'sales-book':'select o.code,c.name customer,o.status,o.due_on,ol.currency,sum(ol.units*ol.unit_price) recorded_line_value from orders o join contacts c on c.id=o.contact_id join order_lines ol on ol.order_id=o.id group by o.id,c.id,ol.currency order by o.due_on',
 losses:"select ref,batch,occurred_on,litres,evidence from v_excise_records where movement='loss' order by occurred_on"
};
export async function resolve(db,entity,value){
 if(!value)throw Error(`Supply a ${entity} name, code or id prefix`);
 const rows=await db.query(`select * from ${entity} where lower(code)=lower($1) or id::text=$1`,[value]);
 if(rows.length===1)return rows[0];
 const candidates=await db.query(`select * from ${entity} where starts_with(lower(code),lower($1)) or starts_with(id::text,$1) ${['contacts','products','locations','vessels'].includes(entity)?'or position(lower($1) in lower(name))>0':''} order by code`,[value]);
 if(candidates.length!==1)throw Error(`${candidates.length?'Ambiguous':'No matching'} ${entity}: ${value}. Candidates: ${candidates.map(r=>r.code+' '+(r.name||r.id)).join('; ')||'(none)'}`);
 return candidates[0];
}
const required=(v,n)=>{if(v===undefined||String(v).trim()==='')throw Error(`Required: ${n}`);return String(v).trim();};
const number=(v,n,{positive=false}={})=>{required(v,n);const x=Number(v);if(!Number.isFinite(x)||(positive&&x<=0))throw Error(`Invalid ${n}: ${v}`);return x;};
const date=v=>{required(v,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Use a real YYYY-MM-DD date');return v;};
async function transaction(db,fn,dry=false){await db.exec('begin');try{const out=await fn();await db.exec(dry?'rollback':'commit');return out;}catch(e){await db.exec('rollback');throw e;}}
const entities=['products','locations','vessels','contacts','batches','orders','order_lines','movements','analyses','notes'];
export async function run(db,args){
 const flags={}; const pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');flags[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const [cmd='help',...a]=pos;
 if(cmd==='help')return [{commands:[...Object.keys(reads),'batch <name>','trace <batch>','add <product|location|vessel|customer|batch|order|line>','receive <batch> <location> <units>','loss <batch> <location> <units>','analyse <batch> <abv>','release <batch>','dispatch <order>','delivery <order>','log <batch> <note>','import vinsight <folder> [--dry-run] [--map=file]','export <folder>','draft-recall <batch>'].join('\n')}];
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='batch'||cmd==='trace'){
  const b=await resolve(db,'batches',a[0]);
  if(cmd==='trace')return db.query('select b.code batch,m.ref,m.kind,m.units,m.occurred_on,l.code location,o.code sales_order,c.name customer,c.email,m.evidence from movements m join batches b on b.id=m.batch_id join locations l on l.id=m.location_id left join orders o on o.id=m.order_id left join contacts c on c.id=o.contact_id where b.id=$1 order by m.occurred_on,m.ref',[b.id]);
  return {batch:b,stock:await db.query('select * from v_stock where batch_id=$1',[b.id]),analyses:await db.query('select * from analyses where batch_id=$1 order by tested_on',[b.id]),notes:await db.query('select body,created_at from notes where batch_id=$1 order by created_at',[b.id])};
 }
 if(cmd==='export'){
  const dir=path.resolve(required(a[0],'export directory'));fs.mkdirSync(dir,{recursive:true});
  return transaction(db,async()=>{await db.exec('set transaction isolation level repeatable read');const counts=[];for(const t of entities){const rows=await db.query(`select * from ${t} order by id`);fs.writeFileSync(path.join(dir,t+'.json'),JSON.stringify(rows,null,2)+'\n');counts.push({entity:t,rows:rows.length});}fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({version:1,at:new Date().toISOString(),counts},null,2));return counts;});
 }
 if(cmd==='import'){
  if(a[0]!=='vinsight')throw Error('Supported import: vinsight');
  const dir=path.resolve(required(a[1],'folder'));const mapping=flags.map?JSON.parse(fs.readFileSync(flags.map,'utf8')):{};
  const files=fs.readdirSync(dir).filter(n=>/\.csv$/i.test(n));if(!files.length)throw Error('No CSV files found');
  return transaction(db,async()=>{
   const out=[];
   for(const file of files){
    const lower=file.toLowerCase().replace(/[^a-z]/g,'');const type=lower.startsWith('vessels')?'vessels':lower.startsWith('stockitems')?'products':lower.startsWith('contacts')?'contacts':null;
    if(!type)throw Error(`Unrecognised file ${file}. See docs/replace-vinsight.md`);
    const rows=parseCsv(fs.readFileSync(path.join(dir,file),'utf8'));if(!rows.length)throw Error(`Empty file: ${file}`);
    for(const raw of rows){
     const row={...raw};for(const [canonical,source] of Object.entries(mapping[type]||{})){if(!(source in raw))throw Error(`Missing mapped column: ${source}`);row[canonical]=raw[source];}
     const code=required(pick(row,type==='vessels'?'Vessel Code':type==='products'?'Stock Item Code':'Contact Code','Code'),`${file}: code`);
     const name=required(pick(row,'Description','Name','Contact Name'),`${file}: name`);
     if(type==='products'){
      const kind=required(pick(row,'Kind'),'Kind (map and classify before import)');const litres=number(pick(row,'Litres Per Unit'),'Litres Per Unit',{positive:true});
      const prev=(await db.query('select * from products where code=$1',[code]))[0];
      if(prev&&(prev.kind!==kind||Number(prev.litres_per_unit)!==litres))throw Error(`Product ${code}: unit size or kind differs. Preserve history and create a new code.`);
      await db.query('insert into products(code,name,kind,litres_per_unit) values($1,$2,$3,$4) on conflict(code) do update set name=excluded.name',[code,name,kind,litres]);
     }else if(type==='contacts')await db.query('insert into contacts(code,name,email) values($1,$2,$3) on conflict(code) do update set name=excluded.name,email=excluded.email',[code,name,pick(row,'Email','Email Address')||null]);
     else await db.query('insert into vessels(code,name) values($1,$2) on conflict(code) do update set name=excluded.name',[code,name]);
    }out.push({file,entity:type,rows:rows.length,dry_run:Boolean(flags['dry-run'])});
   }return out;
  },Boolean(flags['dry-run']));
 }
 if(cmd==='add')return transaction(db,async()=>{
  const [type,code,name]=a;
  if(type==='product')return db.query('insert into products(code,name,kind,litres_per_unit) values($1,$2,$3,$4) returning code,name',[required(code,'code'),required(name,'name'),required(flags.kind,'kind'),number(flags.litres,'litres',{positive:true})]);
  if(type==='location')return db.query('insert into locations(code,name,country,licence_ref) values($1,$2,$3,$4) returning code,name',[required(code,'code'),required(name,'name'),required(flags.country,'country'),flags.licence||null]);
  if(type==='vessel'||type==='customer')return db.query(`insert into ${type==='vessel'?'vessels':'contacts'}(code,name) values($1,$2) returning code,name`,[required(code,'code'),required(name,'name')]);
  if(type==='batch'){
   const p=await resolve(db,'products',flags.product);const v=flags.vessel?await resolve(db,'vessels',flags.vessel):null;
   return db.query('insert into batches(code,product_id,vessel_id,produced_on,source_ref) values($1,$2,$3,$4,$5) returning code,status',[required(code,'code'),p.id,v?.id||null,date(flags.date),required(flags.source,'source')]);
  }
  if(type==='order'){
   const c=await resolve(db,'contacts',flags.customer),l=await resolve(db,'locations',flags.location);
   return db.query('insert into orders(code,contact_id,location_id,due_on,tax_basis) values($1,$2,$3,$4,$5) returning code,status',[required(code,'code'),c.id,l.id,date(flags.due),flags.tax||'review']);
  }
  if(type==='line'){
   const o=await resolve(db,'orders',code),b=await resolve(db,'batches',name);await db.query('select id from orders where id=$1 for update',[o.id]);
   const current=(await db.query('select status from orders where id=$1',[o.id]))[0];if(current.status!=='open')throw Error('Cannot change dispatched orders');
   return db.query('insert into order_lines(order_id,batch_id,units,unit_price,currency) values($1,$2,$3,$4,$5) returning id,units',[o.id,b.id,number(flags.units,'units',{positive:true}),number(flags.price,'price'),required(flags.currency,'currency')]);
  }throw Error('Unknown add type');
 });
 if(['receive','loss','analyse','release','dispatch','delivery','log'].includes(cmd))return transaction(db,async()=>{
  await db.exec('lock table movements,batches,orders in share row exclusive mode');
  if(cmd==='dispatch'||cmd==='delivery'){
   const o=await resolve(db,'orders',a[0]);
   if(cmd==='delivery'){if(o.status!=='dispatched')throw Error('Order has not been dispatched');return db.query('update orders set delivered_on=$2 where id=$1 returning code,delivered_on',[o.id,date(flags.date)]);}
   if(o.status!=='open')throw Error('Order already dispatched');if(o.tax_basis==='review')throw Error('Tax classification requires review');
   const l=(await db.query('select * from locations where id=$1',[o.location_id]))[0];if(!l.licence_ref)throw Error('Location licence reference missing');
   if((l.country==='NZ'&&!o.tax_basis.startsWith('NZ-'))||(l.country==='AU'&&!o.tax_basis.startsWith('AU-')))throw Error('Tax classification does not match location country');
   const lines=await db.query('select ol.*,b.code,b.status,b.abv,b.source_ref from order_lines ol join batches b on b.id=ol.batch_id where order_id=$1',[o.id]);if(!lines.length)throw Error('Order has no lines');
   for(const line of lines){
    if(line.status!=='released'||!line.abv||!line.source_ref)throw Error(`Batch ${line.code} is held or lacks production evidence`);
    const s=(await db.query('select units from v_stock where batch_id=$1 and location_id=$2',[line.batch_id,o.location_id]))[0];if(Number(s.units)<Number(line.units))throw Error(`Insufficient stock for ${line.code}`);
    await db.query("insert into movements(ref,batch_id,location_id,order_id,kind,units,evidence) values($1,$2,$3,$4,'dispatch',$5,$6)",['dispatch:'+o.code+':'+line.code,line.batch_id,o.location_id,o.id,-Number(line.units),required(flags.consignment,'consignment')]);
   }
   return db.query("update orders set status='dispatched',carrier=$2,consignment=$3,duty_ref=$4 where id=$1 returning code,status",[o.id,required(flags.carrier,'carrier'),required(flags.consignment,'consignment'),required(flags.duty,'duty reference')]);
  }
  const b=await resolve(db,'batches',a[0]);
  if(cmd==='log')return db.query('insert into notes(batch_id,body) values($1,$2) returning body',[b.id,required(a.slice(1).join(' '),'note')]);
  if(cmd==='analyse'){
   const abv=number(a[1],'ABV',{positive:true});
   if((await db.query("select id from movements where batch_id=$1 and kind='dispatch' limit 1",[b.id])).length)throw Error('Batch already dispatched: do not rewrite historical ABV; create a separate batch');
   await db.query('insert into analyses(batch_id,tested_on,abv,evidence) values($1,$2,$3,$4)',[b.id,date(flags.date),abv,required(flags.evidence,'evidence')]);
   return db.query('update batches set abv=$2 where id=$1 returning code,abv',[b.id,abv]);
  }
  if(cmd==='release'){
   if(!b.abv||!b.source_ref)throw Error('ABV and production source required');
   if(!(await db.query('select id from analyses where batch_id=$1 and tested_on>=current_date-30 and tested_on<=current_date',[b.id])).length)throw Error('Recent analysis required by house rule');
   return db.query("update batches set status='released' where id=$1 returning code,status",[b.id]);
  }
  const l=await resolve(db,'locations',a[1]),qty=number(a[2],'units',{positive:true});
  if(cmd==='loss'){const s=(await db.query('select units from v_stock where batch_id=$1 and location_id=$2',[b.id,l.id]))[0];if(Number(s.units)<qty)throw Error('Loss exceeds stock');}
  return db.query('insert into movements(ref,batch_id,location_id,kind,units,evidence) values($1,$2,$3,$4,$5,$6) returning ref,kind,units',[required(flags.ref,'unique reference'),b.id,l.id,cmd==='receive'?'receipt':'loss',cmd==='receive'?qty:-qty,required(flags.evidence,'evidence')]);
 });
 if(cmd==='draft-recall'){
  const b=await resolve(db,'batches',a[0]),rows=await run(db,['trace',b.code]);const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,`recall-${b.id}-${Date.now()}.md`);fs.writeFileSync(file,`# DRAFT: trace review for ${b.code}\n\nFor operator review. This is not a recall decision or a sent notice. Confirm the affected lot, hazard, recipients and instructions before any contact.\n\n${JSON.stringify(rows,null,2)}\n`);return [{file,records:rows.length}];
 }
 throw Error(`Unknown command: ${cmd}. Run help.`);
}
function print(value){if(Array.isArray(value)){console.log(table(value,Object.keys(value[0]||{}).map(key=>({key,label:key}))));}else for(const [key,v] of Object.entries(value)){console.log(key);print(Array.isArray(v)?v:[v]);}}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const out=await run(db,process.argv.slice(2));if(process.argv.includes('--json'))console.log(JSON.stringify(out,null,2));else print(out);}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
