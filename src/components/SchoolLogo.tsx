export function SchoolLogo({ink=false,className=''}:{ink?:boolean;className?:string}){
  return <span className={`school-logo ${ink?'school-logo-ink':''} ${className}`}><img src="/branding/logo-madeinsertao.png" alt="Escola de Música de Madalena — Made in Sertão" width="280" height="149" decoding="async"/></span>;
}
