import {INSTRUMENTS,availableInstrument,type InstrumentProfile} from '../lib/instruments';
import {ACCESS_COPY,type AccessLocale} from '../lib/accessLocale';
import {CourseArtwork} from './CourseArtwork';
import {InstrumentTile} from './InstrumentTile';
import {LabIcon} from './LearningHome';
import './workshop-selection.css';
export function workshopText(item:InstrumentProfile,locale:AccessLocale){
 const t=ACCESS_COPY[locale];
 const names:Record<string,string>={iniciacao:t.initiation,'recorder-soprano':t.recorder,'trumpet-bb':t.trumpet,'clarinet-bb':t.clarinet,conductor:t.conducting,'alto-sax':t.sax,trombone:t.trombone,flute:t.flute};
 const descriptions:Record<string,string>={iniciacao:t.initiationDescription,'recorder-soprano':t.recorderDescription,'trumpet-bb':t.trumpetDescription,'clarinet-bb':t.clarinetDescription,conductor:t.conductingDescription,'alto-sax':t.saxDescription,trombone:t.tromboneDescription,flute:t.fluteDescription};
 return {name:names[item.id]??item.name,description:descriptions[item.id]??item.description};
}
export function WorkshopGrid({selectedId,onSelect,locale='pt-BR'}:{selectedId?:string|null;onSelect:(id:string)=>void;locale?:AccessLocale}){
 const t=ACCESS_COPY[locale];
 return <div className="instrument-grid workshop-grid" role="group" aria-label={t.chooseWorkshop}>
  {INSTRUMENTS.map(item=>{const copy=workshopText(item,locale),selected=item.available&&selectedId===item.id;return <button type="button" key={item.id} disabled={!item.available} className={`instrument-card${selected?' selected':''}`} aria-label={`${t.choose} ${copy.name}${item.available?'':` · ${t.comingSoon}`}`} aria-pressed={selected} onClick={()=>onSelect(item.id)}>
   <span className="instrument-emoji" aria-hidden="true"><CourseArtwork instrument={item.id}/></span>
   <span className="instrument-check" aria-hidden="true">{selected?<LabIcon name="check" size={16}/>:!item.available?<LabIcon name="lock" size={14}/>:null}</span>
   <strong>{copy.name}</strong><small>{copy.description}</small>
   <span className="instrument-card-status">{!item.available?t.comingSoon:selected?t.selected:t.choose}</span>
  </button>;})}
 </div>;
}
export function WorkshopSummary({id,locale='pt-BR'}:{id:string;locale?:AccessLocale}){
 const item=availableInstrument(id);if(!item)return null;
 return <span className="workshop-summary"><span className="workshop-summary-art" aria-hidden="true"><InstrumentTile instrument={id}/></span><span><small>{ACCESS_COPY[locale].yourWorkshop}</small><strong>{workshopText(item,locale).name}</strong></span></span>;
}
