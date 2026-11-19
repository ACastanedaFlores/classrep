// Google Apps Script - backend de "Mi Grupo".
// Implementar como: Aplicación web · Ejecutar como: Yo · Acceso: Cualquier persona.
const SHEET_NAME = 'Alumnos';   // nombre de la pestaña
const TOKEN = '';                // opcional: contraseña compartida (la misma en Ajustes de la app)
const HEAD = ['No. Control','Apellido Paterno','Apellido Materno','Nombres','Teléfono','Correo'];

function doGet(e){ return out(handle({a:(e.parameter.action||'list'), token:e.parameter.token})); }
function doPost(e){
  let o; try{ o = JSON.parse(e.postData.contents); }catch(_){ return out({ok:false,error:'JSON inválido'}); }
  return out(handle(o));
}
function out(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheet(){
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(SHEET_NAME);
  if(!s){ s = ss.insertSheet(SHEET_NAME); s.getRange(1,1,1,6).setNumberFormat('@').setValues([HEAD]); }
  return s;
}
const headers = s => s.getRange(1,1,1,Math.max(s.getLastColumn(),6)).getDisplayValues()[0];
function colOf(s,name,create){            // devuelve columna 1-based
  const i = headers(s).indexOf(name);
  if(i>-1) return i+1;
  if(!create) return -1;
  const c = s.getLastColumn()+1;
  s.getRange(1,c).setNumberFormat('@').setValue(name); // texto plano: evita que "18/Nov" se vuelva fecha
  return c;
}
function rowOf(s,control){
  const n = s.getLastRow()-1; if(n<1) return -1;
  const i = s.getRange(2,1,n,1).getDisplayValues().flat().indexOf(String(control));
  return i<0 ? -1 : i+2;
}

function handle(o){
  if(TOKEN && o.token !== TOKEN) return {ok:false,error:'token'};
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const s = sheet();
    switch(o.a){
      case 'list': {
        const v = s.getDataRange().getDisplayValues();
        return {ok:true,data:{headers:v[0],rows:v.slice(1)}};
      }
      case 'add': {
        if(rowOf(s,o.s[0])>-1) return {ok:false,error:'No. Control duplicado'};
        s.getRange(s.getLastRow()+1,1,1,6).setNumberFormat('@').setValues([o.s]);
        return {ok:true};
      }
      case 'update': {
        const r = rowOf(s,o.c); if(r<0) return {ok:false,error:'Alumno no encontrado'};
        s.getRange(r,1,1,6).setNumberFormat('@').setValues([o.s]);
        return {ok:true};
      }
      case 'delete': {
        const r = rowOf(s,o.c); if(r>-1) s.deleteRow(r);
        return {ok:true};
      }
      case 'addCol': colOf(s,o.col,true); return {ok:true};
      case 'delCol': {
        const c = colOf(s,o.col,false);
        if(c>0 && c<=6) return {ok:false,error:'No se pueden borrar las columnas fijas'};
        if(c>0) s.deleteColumn(c);
        return {ok:true};
      }
      case 'setVals': {   // asistencia y columnas extra: {col, v:{control:valor}}
        const c = colOf(s,o.col,true), n = s.getLastRow()-1;
        if(n<1) return {ok:true};
        const ids = s.getRange(2,1,n,1).getDisplayValues().flat();
        const rng = s.getRange(2,c,n,1), cur = rng.getValues().flat();
        rng.setNumberFormat('@').setValues(ids.map((k,i)=>[k in o.v ? o.v[k] : cur[i]]));
        return {ok:true};
      }
      default: return {ok:false,error:'Acción desconocida'};
    }
  }catch(err){ return {ok:false,error:String(err)}; }
  finally{ lock.releaseLock(); }
}
