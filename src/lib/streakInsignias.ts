/** Presentation tiers for the actual consecutive-day count. Storage stays unchanged. */
export const STREAK_INSIGNIAS=[
  {id:'tiquinho',artwork:'/branding/cactom/insignias/tiquinho-v1.png',name:'Tiquinho',days:1},
  {id:'passinho',artwork:'/branding/cactom/insignias/passinho-v1.png',name:'Passinho',days:3},
  {id:'embalo',artwork:'/branding/cactom/insignias/embalo-v1.png',name:'Embalo',days:7},
  {id:'rojao-firme',artwork:'/branding/cactom/insignias/rojao-firme-v1.png',name:'Rojão firme',days:14},
  {id:'estirao',artwork:'/branding/cactom/insignias/estirao-v1.png',name:'Estirão',days:30},
] as const;

export type StreakInsignia=(typeof STREAK_INSIGNIAS)[number];

export function insigniaForStreak(days:number):StreakInsignia|null{
  if(!Number.isSafeInteger(days)||days<1)return null;
  let reached:StreakInsignia|null=null;
  for(const insignia of STREAK_INSIGNIAS){
    if(days<insignia.days)break;
    reached=insignia;
  }
  return reached;
}
